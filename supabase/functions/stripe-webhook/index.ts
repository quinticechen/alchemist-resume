
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.18.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Get the stripe webhook secret from environment variables
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeWebhookSecret || !stripeSecretKey) {
      console.error('Missing required environment variables: STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the signature from the header
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('No Stripe signature found in request');
      return new Response(
        JSON.stringify({ error: 'No Stripe signature found in request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the raw body
    const body = await req.text();
    
    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
    
    let event;
    try {
      // Verify the event
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Extract necessary info from session
        const userId = session.client_reference_id;
        const stripeCustomerId = session.customer;
        const stripeSubscriptionId = session.subscription;
        
        if (!userId || !stripeCustomerId || !stripeSubscriptionId) {
          console.error('Missing required fields in checkout session');
          return new Response(
            JSON.stringify({ error: 'Missing required fields in checkout session' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        
        if (!subscription) {
          console.error('Could not retrieve subscription details from Stripe');
          return new Response(
            JSON.stringify({ error: 'Could not retrieve subscription details from Stripe' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Determine tier from subscription item plan
        const item = subscription.items.data[0];
        const priceId = item.price.id;
        
        // Map price ID to tier
        let tier = 'apprentice';
        if (priceId.includes('alchemist')) {
          tier = 'alchemist';
        } else if (priceId.includes('grandmaster')) {
          tier = 'grandmaster';
        }
        
        // Call database function to update user subscription
        const { data, error } = await supabase.rpc('update_subscription_and_transaction', {
          p_user_id: userId,
          p_stripe_customer_id: stripeCustomerId,
          p_stripe_subscription_id: stripeSubscriptionId,
          p_status: subscription.status,
          p_tier: tier,
          p_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          p_cancel_at_period_end: subscription.cancel_at_period_end,
          p_stripe_session_id: session.id,
          p_amount: session.amount_total / 100, // Convert cents to dollars
          p_currency: session.currency,
          p_payment_status: session.payment_status
        });
        
        if (error) {
          console.error('Error updating subscription in database:', error);
          return new Response(
            JSON.stringify({ error: 'Error updating subscription in database' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.log(`Successfully processed checkout session for user ${userId}`);
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        // Get customer ID and find the user
        const stripeCustomerId = subscription.customer;
        
        const { data: users, error: userError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', stripeCustomerId)
          .single();
        
        if (userError || !users) {
          console.error('Error finding user with stripe customer ID:', stripeCustomerId, userError);
          return new Response(
            JSON.stringify({ error: 'Error finding user with stripe customer ID' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const userId = users.user_id;
        
        // Update subscription status
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end
          })
          .eq('user_id', userId);
        
        if (error) {
          console.error('Error updating subscription status:', error);
          return new Response(
            JSON.stringify({ error: 'Error updating subscription status' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.log(`Successfully updated subscription for user ${userId}`);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Get customer ID and find the user
        const stripeCustomerId = subscription.customer;
        
        const { data: users, error: userError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', stripeCustomerId)
          .single();
        
        if (userError || !users) {
          console.error('Error finding user with stripe customer ID:', stripeCustomerId, userError);
          return new Response(
            JSON.stringify({ error: 'Error finding user with stripe customer ID' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const userId = users.user_id;
        
        // Update user profile to free tier
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            subscription_status: 'apprentice'
          })
          .eq('id', userId);
        
        if (profileError) {
          console.error('Error updating user profile to free tier:', profileError);
          return new Response(
            JSON.stringify({ error: 'Error updating user profile to free tier' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Update subscription status
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: false
          })
          .eq('user_id', userId);
        
        if (error) {
          console.error('Error updating subscription to canceled:', error);
          return new Response(
            JSON.stringify({ error: 'Error updating subscription to canceled' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.log(`Successfully processed subscription cancellation for user ${userId}`);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing webhook:', error.message);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
