
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.18.0?target=deno";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    console.error('No Stripe signature found in webhook request');
    return new Response('No signature', { 
      status: 400,
      headers: corsHeaders 
    });
  }

  try {
    const body = await req.text();
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!endpointSecret) {
      console.error('No webhook secret found');
      return new Response('No webhook secret configured', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { 
        status: 400,
        headers: corsHeaders 
      });
    }

    console.log(`Received Stripe webhook event: ${event.type}`);
    console.log('Event data:', JSON.stringify(event.data.object, null, 2));

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'checkout.session.completed':
        const subscription = event.type === 'checkout.session.completed'
          ? await stripe.subscriptions.retrieve(event.data.object.subscription)
          : event.data.object;
        
        const customerId = subscription.customer;
        
        // Get customer to find Supabase user ID
        const customer = await stripe.customers.retrieve(customerId);
        const userId = customer.metadata.supabase_uid;

        if (!userId) {
          console.error('No user ID found in customer metadata');
          throw new Error('No user ID found in customer metadata');
        }

        // Get the price ID to determine the tier
        const priceId = subscription.items.data[0].price.id;
        let tier = 'apprentice';
        
        // Map price IDs to subscription tiers
        switch (priceId) {
          case 'price_1Qs0CVGYVYFmwG4FmEwa1iWO':
          case 'price_1Qs0ECGYVYFmwG4FluFhUdQH':
            tier = 'alchemist';
            break;
          case 'price_1Qs0BTGYVYFmwG4FFDbYpi5v':
          case 'price_1Qs0BtGYVYFmwG4FrtkMrNNx':
            tier = 'grandmaster';
            break;
        }

        // Only update if subscription is active
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          console.log(`Updating subscription for user ${userId} to tier ${tier}`);
          
          // Update subscriptions table
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              status: subscription.status,
              tier: tier,
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000),
              cancel_at_period_end: subscription.cancel_at_period_end,
            }, {
              onConflict: 'user_id',
            });

          if (subscriptionError) {
            console.error('Error updating subscription:', subscriptionError);
            throw subscriptionError;
          }

          // Update profile's subscription status
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              subscription_status: tier,
              monthly_usage_count: tier === 'apprentice' ? null : 0,
              monthly_usage_reset_date: tier === 'alchemist' ? new Date() : null
            })
            .eq('id', userId);

          if (profileError) {
            console.error('Error updating profile:', profileError);
            throw profileError;
          }

          console.log(`Successfully updated subscription and profile for user ${userId}`);
        } else {
          console.log(`Subscription ${subscription.id} status is ${subscription.status}, not updating database`);
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        const deletedCustomer = await stripe.customers.retrieve(deletedSubscription.customer);
        const deletedUserId = deletedCustomer.metadata.supabase_uid;

        if (deletedUserId) {
          console.log(`Cancelling subscription for user ${deletedUserId}`);
          
          // Update subscription status
          const { error: deleteSubError } = await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              cancel_at_period_end: true,
            })
            .eq('user_id', deletedUserId);

          if (deleteSubError) {
            console.error('Error updating subscription on deletion:', deleteSubError);
            throw deleteSubError;
          }

          // Reset profile subscription status
          const { error: deleteProfileError } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'apprentice',
              monthly_usage_count: null,
              monthly_usage_reset_date: null
            })
            .eq('id', deletedUserId);

          if (deleteProfileError) {
            console.error('Error updating profile on deletion:', deleteProfileError);
            throw deleteProfileError;
          }

          console.log(`Successfully cancelled subscription for user ${deletedUserId}`);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
