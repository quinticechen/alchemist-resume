import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@latest?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-environment",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey || !webhookSecret) {
      console.error("Required environment variables are not set");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Stripe signature is missing" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const body = await req.text();
    let event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({
          error: `Webhook signature verification failed: ${err.message}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle the event
    console.log(`Processing event: ${event.type}`);

    // Process webhook events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const stripeCustomerId = session.customer;
        const stripeSubscriptionId = session.subscription;

        if (!userId || !stripeCustomerId || !stripeSubscriptionId) {
          console.error(
            "Missing required fields in checkout.session.completed event"
          );
          break;
        }

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(
          stripeSubscriptionId
        );

        // Determine the subscription tier from metadata
        const tier = session.metadata?.planId || "alchemist"; // Default to 'alchemist' if not specified

        // Validate tier value
        const validTiers = ["apprentice", "alchemist", "grandmaster"];
        if (!validTiers.includes(tier)) {
          console.error(`Invalid tier value: ${tier}`);
          break; // Stop processing if tier is invalid
        }

        // Update user subscription status in the database
        await supabase.rpc("update_subscription_and_transaction", {
          p_user_id: userId,
          p_stripe_customer_id: stripeCustomerId,
          p_stripe_subscription_id: stripeSubscriptionId,
          p_status: subscription.status,
          p_tier: tier,
          p_current_period_start: new Date(
            subscription.current_period_start * 1000
          ).toISOString(),
          p_current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
          p_cancel_at_period_end: subscription.cancel_at_period_end,
          p_stripe_session_id: session.id,
          p_amount: session.amount_total / 100, // Convert from cents to dollars
          p_currency: session.currency,
          p_payment_status: "paid",
        });

        console.log(`Updated subscription for user ${userId} to tier ${tier}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const stripeSubscriptionId = subscription.id;

        // Find the user by subscription ID
        const { data: subscriptionData, error: subError } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", stripeSubscriptionId)
          .single();

        if (subError || !subscriptionData) {
          console.error(
            `No user found for subscription ${stripeSubscriptionId}`
          );
          break;
        }

        const userId = subscriptionData.user_id;

        // Get the tier from the product metadata or existing records
        let tier;
        if (
          subscription.items &&
          subscription.items.data &&
          subscription.items.data.length > 0
        ) {
          const priceId = subscription.items.data[0].price.id;

          // Get the product for this price to determine the tier
          try {
            const price = await stripe.prices.retrieve(priceId);
            const product = await stripe.products.retrieve(
              price.product as string
            );
            tier = product.metadata.tier || null;
          } catch (err) {
            console.error(`Error retrieving product info: ${err.message}`);
          }
        }

        if (!tier) {
          // If tier not found from Stripe, use existing tier from database
          const { data: existingSubscription, error: existingError } =
            await supabase
              .from("subscriptions")
              .select("tier")
              .eq("stripe_subscription_id", stripeSubscriptionId)
              .single();

          tier = existingError ? "alchemist" : existingSubscription.tier;
        }

        // Update the subscription in the database
        await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            current_period_start: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", stripeSubscriptionId);

        console.log(
          `Updated subscription ${stripeSubscriptionId} status to ${subscription.status}`
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const stripeSubscriptionId = subscription.id;

        // Find the user by subscription ID
        const { data: subscriptionData, error: subError } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", stripeSubscriptionId)
          .single();

        if (subError || !subscriptionData) {
          console.error(
            `No user found for subscription ${stripeSubscriptionId}`
          );
          break;
        }

        const userId = subscriptionData.user_id;

        // Update the subscription status
        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", stripeSubscriptionId);

        // Update the user's profile to revert to free tier
        await supabase
          .from("profiles")
          .update({
            subscription_status: "apprentice",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        console.log(
          `Subscription ${stripeSubscriptionId} canceled for user ${userId}`
        );
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Webhook error: ${error.message}`);
    return new Response(
      JSON.stringify({ error: `Webhook error: ${error.message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
