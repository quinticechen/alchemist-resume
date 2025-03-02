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
        const userId = session.client_reference_id; // 從 client_reference_id 獲取 user.id
        const stripeCustomerId = session.customer;
        const stripeSubscriptionId = session.subscription;
        const subscription = await stripe.subscriptions.retrieve(
          stripeSubscriptionId
        );
        const priceId = subscription.items.data[0].price.id;

        if (!userId) {
          console.error("No user ID found in client_reference_id");
          return new Response(JSON.stringify({ error: "No user ID found" }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        let tier;
        for (const [plan, prices] of Object.entries(PLANS)) {
          if (prices.monthly === priceId || prices.annual === priceId) {
            tier = plan;
            break;
          }
        }
        if (!tier) {
          tier = "alchemist"; // 預設 tier
          console.error(`Could not find tier for price ID ${priceId}`);
        }

        // 插入交易記錄
        const { error: transactionError } = await supabase
          .from("transactions")
          .insert({
            user_id: userId,
            stripe_session_id: session.id,
            stripe_subscription_id: stripeSubscriptionId,
            amount: session.amount_total / 100,
            currency: session.currency,
            status: session.payment_status,
            created_at: new Date().toISOString(),
            tier: tier,
          });

        if (transactionError) {
          console.error("Error inserting transaction:", transactionError);
          return new Response(JSON.stringify({ error: "Transaction error" }), {
            status: 500,
            headers: corsHeaders,
          });
        }

        // 更新 subscriptions table
        const { error: subscriptionUpdateError } = await supabase
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
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
            { onConflict: "user_id" }
          );

        if (subscriptionUpdateError) {
          console.error(
            "Error updating subscription:",
            subscriptionUpdateError
          );
          return new Response(
            JSON.stringify({ error: "Subscription update error" }),
            { status: 500, headers: corsHeaders }
          );
        }

        // 更新 profile's subscription status
        const { error: profileUpdateError } = await supabase
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

        if (profileUpdateError) {
          console.error("Error updating profile:", profileUpdateError);
          return new Response(
            JSON.stringify({ error: "Profile update error" }),
            { status: 500, headers: corsHeaders }
          );
        }

        console.log(
          `Successfully updated subscription and profile for user ${userId}`
        );
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSubscription = event.data.object;
        const deletedCustomer = await stripe.customers.retrieve(
          deletedSubscription.customer
        );
        const deletedUserId = deletedCustomer.metadata.supabase_uid;

        if (deletedUserId) {
          console.log(`Cancelling subscription for user ${deletedUserId}`);

          // 更新 subscription status
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
            return new Response(
              JSON.stringify({ error: "Subscription deletion error" }),
              { status: 500, headers: corsHeaders }
            );
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
            return new Response(
              JSON.stringify({ error: "Profile deletion error" }),
              { status: 500, headers: corsHeaders }
            );
          }

          console.log(
            `Successfully cancelled subscription for user ${deletedUserId}`
          );
        }
        break;
      }

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
