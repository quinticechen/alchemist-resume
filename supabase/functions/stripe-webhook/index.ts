import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.18.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Add CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-application-name, x-environment",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // For Stripe webhooks, we don't need to check authorization header
  // Instead, we verify the request using the Stripe signature
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.error("No Stripe signature found in webhook request");
    return new Response("No signature", {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.text();
    const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!endpointSecret) {
      console.error("No webhook secret found");
      return new Response("No webhook secret configured", {
        status: 500,
        headers: corsHeaders,
      });
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, {
        status: 400,
        headers: corsHeaders,
      });
    }

    console.log(`Received Stripe webhook event: ${event.type}`);
    console.log("Event data:", JSON.stringify(event.data.object, null, 2));

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const stripeCustomerId = session.customer;

        const subscription =
          event.type === "checkout.session.completed"
            ? await stripe.subscriptions.retrieve(
                event.data.object.subscription
              )
            : event.data.object;

        const customerId = subscription.customer;

        const customer = await stripe.customers.retrieve(customerId);
        const tier = session.metadata?.planId || "alchemist";

        if (!userId) {
          console.error("No user ID found in customer metadata");
          throw new Error("No user ID found in customer metadata");
        }

        // 插入交易記錄到 transactions 資料表
        const { error: transactionError } = await supabase
          .from("transactions")
          .insert({
            user_id: userId,
            stripe_session_id: session.id,
            stripe_subscription_id: subscription.id,
            amount: session.amount_total / 100, // 將 cents 轉換為 dollars
            currency: session.currency,
            status: "paid", // 假設交易成功
            created_at: new Date().toISOString(),
            tier: tier,
          });

        if (transactionError) {
          console.error("Error inserting transaction:", transactionError);
          throw transactionError;
        }

        // 更新 subscriptions table
        const { error: subscriptionError } = await supabase
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              status: subscription.status,
              tier: tier,
              current_period_start: new Date(
                subscription.current_period_start * 1000
              ),
              current_period_end: new Date(
                subscription.current_period_end * 1000
              ),
              cancel_at_period_end: subscription.cancel_at_period_end,
            },
            {
              onConflict: "user_id",
            }
          );

        if (subscriptionError) {
          console.error("Error updating subscription:", subscriptionError);
          throw subscriptionError;
        }

        // 更新 profile's subscription status
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            subscription_status: tier,
            monthly_usage_count: tier === "apprentice" ? null : 0,
            monthly_usage_reset_date:
              tier === "alchemist"
                ? new Date(subscription.current_period_start * 1000)
                : null,
          })
          .eq("id", userId);

        if (profileError) {
          console.error("Error updating profile:", profileError);
          throw profileError;
        }

        console.log(
          `Successfully updated subscription and profile for user ${userId}`
        );

        break;
      }

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object;
        const deletedCustomer = await stripe.customers.retrieve(
          deletedSubscription.customer
        );
        const deletedUserId = deletedCustomer.metadata.supabase_uid;

        if (deletedUserId) {
          console.log(`Cancelling subscription for user ${deletedUserId}`);

          // Update subscription status
          const { error: deleteSubError } = await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              cancel_at_period_end: true,
            })
            .eq("user_id", deletedUserId);

          if (deleteSubError) {
            console.error(
              "Error updating subscription on deletion:",
              deleteSubError
            );
            throw deleteSubError;
          }

          // Reset profile subscription status
          const { error: deleteProfileError } = await supabase
            .from("profiles")
            .update({
              subscription_status: "apprentice",
              monthly_usage_count: null,
              monthly_usage_reset_date: null,
            })
            .eq("id", deletedUserId);

          if (deleteProfileError) {
            console.error(
              "Error updating profile on deletion:",
              deleteProfileError
            );
            throw deleteProfileError;
          }

          console.log(
            `Successfully cancelled subscription for user ${deletedUserId}`
          );
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// import Stripe from "https://esm.sh/stripe@latest?target=deno";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers":
//     "authorization, x-client-info, apikey, content-type, x-environment",
// };

// serve(async (req) => {
//   // Handle CORS preflight requests
//   if (req.method === "OPTIONS") {
//     return new Response(null, { headers: corsHeaders });
//   }

//   try {
//     const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
//     const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

//     if (!stripeSecretKey || !webhookSecret) {
//       console.error("Required environment variables are not set");
//       return new Response(
//         JSON.stringify({ error: "Server configuration error" }),
//         {
//           status: 500,
//           headers: { ...corsHeaders, "Content-Type": "application/json" },
//         }
//       );
//     }

//     const signature = req.headers.get("stripe-signature");
//     if (!signature) {
//       return new Response(
//         JSON.stringify({ error: "Stripe signature is missing" }),
//         {
//           status: 400,
//           headers: { ...corsHeaders, "Content-Type": "application/json" },
//         }
//       );
//     }

//     const stripe = new Stripe(stripeSecretKey, {
//       apiVersion: "2023-10-16",
//     });

//     const body = await req.text();
//     let event;

//     try {
//       event = await stripe.webhooks.constructEventAsync(
//         body,
//         signature,
//         webhookSecret
//       );
//     } catch (err) {
//       console.error(`Webhook signature verification failed: ${err.message}`);
//       return new Response(
//         JSON.stringify({
//           error: `Webhook signature verification failed: ${err.message}`,
//         }),
//         {
//           status: 400,
//           headers: { ...corsHeaders, "Content-Type": "application/json" },
//         }
//       );
//     }

//     // Create Supabase client
//     const supabaseUrl = Deno.env.get("SUPABASE_URL");
//     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

//     if (!supabaseUrl || !supabaseServiceKey) {
//       return new Response(
//         JSON.stringify({ error: "Supabase configuration error" }),
//         {
//           status: 500,
//           headers: { ...corsHeaders, "Content-Type": "application/json" },
//         }
//       );
//     }

//     const supabase = createClient(supabaseUrl, supabaseServiceKey);

//     // Handle the event
//     console.log(`Processing event: ${event.type}`);

//     // Process webhook events
//     switch (event.type) {
//       case "checkout.session.completed": {
//         const session = event.data.object;
//         // const userId = session.client_reference_id;
//         const customer = await stripe.customers.retrieve(customerId);
//         const userId = customer.metadata.supabase_uid;
//         const stripeCustomerId = session.customer;
//         const stripeSubscriptionId = session.subscription;

//         if (!userId || !stripeCustomerId || !stripeSubscriptionId) {
//           console.error(
//             "Missing required fields in checkout.session.completed event"
//           );
//           break;
//         }

//         // Get subscription details from Stripe
//         const subscription = await stripe.subscriptions.retrieve(
//           stripeSubscriptionId
//         );

//         // Determine the subscription tier from metadata
//         const tier = session.metadata?.planId || "alchemist"; // Default to 'alchemist' if not specified

//         // Validate tier value
//         const validTiers = ["apprentice", "alchemist", "grandmaster"];
//         if (!validTiers.includes(tier)) {
//           console.error(`Invalid tier value: ${tier}`);
//           break; // Stop processing if tier is invalid
//         }

//         // Update user subscription status in the database
//         await supabase.rpc("update_subscription_and_transaction", {
//           p_user_id: userId,
//           p_stripe_customer_id: stripeCustomerId,
//           p_stripe_subscription_id: stripeSubscriptionId,
//           p_status: subscription.status,
//           p_tier: tier,
//           p_current_period_start: new Date(
//             subscription.current_period_start * 1000
//           ).toISOString(),
//           p_current_period_end: new Date(
//             subscription.current_period_end * 1000
//           ).toISOString(),
//           p_cancel_at_period_end: subscription.cancel_at_period_end,
//           p_stripe_session_id: session.id,
//           p_amount: session.amount_total / 100, // Convert from cents to dollars
//           p_currency: session.currency,
//           p_payment_status: "paid",
//         });

//         console.log(`Updated subscription for user ${userId} to tier ${tier}`);
//         break;
//       }

//       case "customer.subscription.updated": {
//         const subscription = event.data.object;
//         const stripeSubscriptionId = subscription.id;

//         // Find the user by subscription ID
//         const { data: subscriptionData, error: subError } = await supabase
//           .from("subscriptions")
//           .select("user_id")
//           .eq("stripe_subscription_id", stripeSubscriptionId)
//           .single();

//         if (subError || !subscriptionData) {
//           console.error(
//             `No user found for subscription ${stripeSubscriptionId}`
//           );
//           break;
//         }

//         const userId = subscriptionData.user_id;

//         // Get the tier from the product metadata or existing records
//         let tier;
//         if (
//           subscription.items &&
//           subscription.items.data &&
//           subscription.items.data.length > 0
//         ) {
//           const priceId = subscription.items.data[0].price.id;

//           // Get the product for this price to determine the tier
//           try {
//             const price = await stripe.prices.retrieve(priceId);
//             const product = await stripe.products.retrieve(
//               price.product as string
//             );
//             tier = product.metadata.tier || null;
//           } catch (err) {
//             console.error(`Error retrieving product info: ${err.message}`);
//           }
//         }

//         if (!tier) {
//           // If tier not found from Stripe, use existing tier from database
//           const { data: existingSubscription, error: existingError } =
//             await supabase
//               .from("subscriptions")
//               .select("tier")
//               .eq("stripe_subscription_id", stripeSubscriptionId)
//               .single();

//           tier = existingError ? "alchemist" : existingSubscription.tier;
//         }

//         // Update the subscription in the database
//         await supabase
//           .from("subscriptions")
//           .update({
//             status: subscription.status,
//             current_period_start: new Date(
//               subscription.current_period_start * 1000
//             ).toISOString(),
//             current_period_end: new Date(
//               subscription.current_period_end * 1000
//             ).toISOString(),
//             cancel_at_period_end: subscription.cancel_at_period_end,
//             updated_at: new Date().toISOString(),
//           })
//           .eq("stripe_subscription_id", stripeSubscriptionId);

//         console.log(
//           `Updated subscription ${stripeSubscriptionId} status to ${subscription.status}`
//         );
//         break;
//       }

//       case "customer.subscription.deleted": {
//         const subscription = event.data.object;
//         const stripeSubscriptionId = subscription.id;

//         // Find the user by subscription ID
//         const { data: subscriptionData, error: subError } = await supabase
//           .from("subscriptions")
//           .select("user_id")
//           .eq("stripe_subscription_id", stripeSubscriptionId)
//           .single();

//         if (subError || !subscriptionData) {
//           console.error(
//             `No user found for subscription ${stripeSubscriptionId}`
//           );
//           break;
//         }

//         const userId = subscriptionData.user_id;

//         // Update the subscription status
//         await supabase
//           .from("subscriptions")
//           .update({
//             status: "canceled",
//             updated_at: new Date().toISOString(),
//           })
//           .eq("stripe_subscription_id", stripeSubscriptionId);

//         // Update the user's profile to revert to free tier
//         await supabase
//           .from("profiles")
//           .update({
//             subscription_status: "apprentice",
//             updated_at: new Date().toISOString(),
//           })
//           .eq("id", userId);

//         console.log(
//           `Subscription ${stripeSubscriptionId} canceled for user ${userId}`
//         );
//         break;
//       }
//     }

//     return new Response(JSON.stringify({ received: true }), {
//       status: 200,
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });
//   } catch (error) {
//     console.error(`Webhook error: ${error.message}`);
//     return new Response(
//       JSON.stringify({ error: `Webhook error: ${error.message}` }),
//       {
//         status: 500,
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//       }
//     );
//   }
// });
