import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.18.0?target=deno";

// Define the price IDs as constants
const PLANS = {
  alchemist: {
    monthly: 'price_1Qs0CVGYVYFmwG4FmEwa1iWO',
    annual: 'price_1Qs0ECGYVYFmwG4FluFhUdQH',
  },
  grandmaster: {
    monthly: 'price_1Qs0BTGYVYFmwG4FFDbYpi5v',
    annual: 'price_1Qs0BtGYVYFmwG4FrtkMrNNx',
  },
};

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

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("Checkout session completed:", session);
        
        // Extract user ID from client_reference_id
        const userId = session.client_reference_id;
        if (!userId) {
          console.error("No user ID found in client_reference_id");
          return new Response(JSON.stringify({ error: "No user ID found" }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        // Get subscription details
        const stripeCustomerId = session.customer;
        const stripeSubscriptionId = session.subscription;
        
        if (!stripeSubscriptionId) {
          console.error("No subscription ID in checkout session");
          return new Response(JSON.stringify({ error: "No subscription found" }), {
            status: 400,
            headers: corsHeaders,
          });
        }
        
        const subscription = await stripe.subscriptions.retrieve(
          stripeSubscriptionId
        );
        
        // Determine the tier from the price ID
        const priceId = subscription.items.data[0].price.id;
        let tier = null;
        let isAnnual = false;
        
        Object.entries(PLANS).forEach(([plan, prices]) => {
          if (prices.monthly === priceId) {
            tier = plan;
            isAnnual = false;
          } else if (prices.annual === priceId) {
            tier = plan;
            isAnnual = true;
          }
        });
        
        if (!tier) {
          tier = "alchemist"; // Default tier
          console.error(`Could not find tier for price ID ${priceId}, using default`);
        }
        
        console.log(`Determined plan: ${tier}, isAnnual: ${isAnnual}`);

        // Calculate the next reset date for monthly usage count
        // For alchemist tier: reset every month, for grandmaster: no reset (unlimited)
        let nextResetDate = null;
        if (tier === 'alchemist') {
          // For monthly reset, set to one month from current period start
          const startDate = new Date(subscription.current_period_start * 1000);
          nextResetDate = new Date(startDate);
          nextResetDate.setMonth(nextResetDate.getMonth() + 1);
        }
        
        // Insert transaction record
        const { error: transactionError } = await supabase
          .from("transactions")
          .insert({
            user_id: userId,
            stripe_session_id: session.id,
            stripe_subscription_id: stripeSubscriptionId,
            amount: session.amount_total / 100, // Convert from cents to dollars
            currency: session.currency,
            status: session.payment_status,
            tier: tier,
            created_at: new Date().toISOString(),
          });

        if (transactionError) {
          console.error("Error inserting transaction:", transactionError);
          return new Response(JSON.stringify({ error: "Transaction error" }), {
            status: 500,
            headers: corsHeaders,
          });
        }

        // Update subscriptions table
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
              ).toISOString(),
              current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
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

        // Update profile's subscription status
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({
            subscription_status: tier,
            monthly_usage_count: 0, // Reset when new subscription begins
            monthly_usage_reset_date: nextResetDate ? nextResetDate.toISOString() : null,
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
      
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Get the user ID from customer metadata
        const customer = await stripe.customers.retrieve(customerId);
        const userId = customer.metadata.supabase_uid;
        
        if (!userId) {
          // Try to find the user from the subscriptions table
          const { data: subscriptionData } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscription.id)
            .single();
            
          if (subscriptionData) {
            console.log(`Found user ${subscriptionData.user_id} from subscription`);
            // Update the subscription
            await handleSubscriptionUpdate(subscription, subscriptionData.user_id);
          } else {
            console.error("Could not find user for subscription:", subscription.id);
          }
        } else {
          // Update the subscription using the user ID from metadata
          await handleSubscriptionUpdate(subscription, userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Get the user ID from customer metadata
        const customer = await stripe.customers.retrieve(customerId);
        const userId = customer.metadata.supabase_uid;
        
        if (!userId) {
          // Try to find the user from the subscriptions table
          const { data: subscriptionData } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscription.id)
            .single();
            
          if (subscriptionData) {
            await handleSubscriptionCancellation(subscription, subscriptionData.user_id);
          } else {
            console.error("Could not find user for cancelled subscription:", subscription.id);
          }
        } else {
          await handleSubscriptionCancellation(subscription, userId);
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

// Helper function to update subscription information
async function handleSubscriptionUpdate(subscription, userId) {
  // Determine the tier from the price ID
  const priceId = subscription.items.data[0].price.id;
  let tier = null;
  let isAnnual = false;
  
  Object.entries(PLANS).forEach(([plan, prices]) => {
    if (prices.monthly === priceId) {
      tier = plan;
      isAnnual = false;
    } else if (prices.annual === priceId) {
      tier = plan;
      isAnnual = true;
    }
  });
  
  if (!tier) {
    tier = "alchemist"; // Default tier
    console.error(`Could not find tier for price ID ${priceId}, using default`);
  }
  
  // Calculate the next reset date for monthly usage count
  let nextResetDate = null;
  if (tier === 'alchemist') {
    // For monthly reset, set to one month from current period start
    const startDate = new Date(subscription.current_period_start * 1000);
    nextResetDate = new Date(startDate);
    nextResetDate.setMonth(nextResetDate.getMonth() + 1);
  }
  
  // Update subscriptions table
  const { error: subscriptionUpdateError } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: subscription.customer,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        tier: tier,
        current_period_start: new Date(
          subscription.current_period_start * 1000
        ).toISOString(),
        current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
      { onConflict: "user_id" }
    );

  if (subscriptionUpdateError) {
    console.error("Error updating subscription:", subscriptionUpdateError);
    return;
  }

  // Update profile's subscription status
  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({
      subscription_status: tier,
      monthly_usage_count: 0, // Reset when subscription renews
      monthly_usage_reset_date: nextResetDate ? nextResetDate.toISOString() : null,
    })
    .eq("id", userId);

  if (profileUpdateError) {
    console.error("Error updating profile:", profileUpdateError);
    return;
  }

  console.log(`Successfully updated subscription for user ${userId}`);
}

// Helper function to handle subscription cancellation
async function handleSubscriptionCancellation(subscription, userId) {
  console.log(`Handling subscription cancellation for user ${userId}`);
  
  // Update subscription status
  const { error: deleteSubError } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: true,
    })
    .eq("user_id", userId);

  if (deleteSubError) {
    console.error("Error updating subscription on deletion:", deleteSubError);
    return;
  }

  // Reset profile subscription status
  const { error: deleteProfileError } = await supabase
    .from("profiles")
    .update({
      subscription_status: "apprentice",
      monthly_usage_count: null,
      monthly_usage_reset_date: null,
    })
    .eq("id", userId);

  if (deleteProfileError) {
    console.error("Error updating profile on deletion:", deleteProfileError);
    return;
  }

  console.log(`Successfully cancelled subscription for user ${userId}`);
}