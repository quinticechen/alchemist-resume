import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the signature from the header
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(JSON.stringify({ error: 'No signature provided' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the raw request body
    const body = await req.text();
    
    // Initialize Stripe with secret key
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
    
    // Verify the webhook signature
    let event;
    try {
      const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', session);

        // Extract customer and subscription info
        const { customer, subscription, metadata } = session;
        const userId = metadata?.user_id;

        if (!userId) {
          console.error('No user_id in session metadata');
          return new Response(JSON.stringify({ error: 'No user_id in session metadata' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Get subscription details from Stripe
        const subscriptionData = await stripe.subscriptions.retrieve(subscription);
        const plan = subscriptionData.items.data[0]?.plan;
        
        if (!plan) {
          console.error('No plan found in subscription');
          return new Response(JSON.stringify({ error: 'No plan found in subscription' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Determine subscription tier based on product ID
        let tier = 'apprentice';
        if (plan.product === 'prod_alchemist') {
          tier = 'alchemist';
        } else if (plan.product === 'prod_grandmaster') {
          tier = 'grandmaster';
        }

        // Call the database function to update subscription and transaction
        const { data, error } = await supabase.rpc('update_subscription_and_transaction', {
          p_user_id: userId,
          p_stripe_customer_id: customer,
          p_stripe_subscription_id: subscription,
          p_status: 'active',
          p_tier: tier,
          p_current_period_start: new Date(subscriptionData.current_period_start * 1000).toISOString(),
          p_current_period_end: new Date(subscriptionData.current_period_end * 1000).toISOString(),
          p_cancel_at_period_end: subscriptionData.cancel_at_period_end,
          p_stripe_session_id: session.id,
          p_amount: session.amount_total / 100,
          p_currency: session.currency,
          p_payment_status: session.payment_status
        });

        if (error) {
          console.error('Error updating subscription:', error);
          return new Response(JSON.stringify({ error: 'Database update failed' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Subscription updated successfully');
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Subscription updated:', subscription);
        
        // Handle subscription updates (status changes, plan changes, etc.)
        // Implement similar logic to checkout.session.completed
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Subscription cancelled:', subscription);
        
        // Handle subscription cancellation
        // Update user's subscription status to 'cancelled' or 'apprentice'
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return new Response(JSON.stringify({ error: `Webhook error: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
