
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

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        endpointSecret || ''
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log(`Event type: ${event.type}`);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Get customer to find Supabase user ID
        const customer = await stripe.customers.retrieve(customerId);
        const userId = customer.metadata.supabase_uid;

        if (!userId) {
          throw new Error('No user ID found in customer metadata');
        }

        // Get the price nickname to determine the tier
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

        console.log(`Updating subscription for user ${userId} to tier ${tier}`);

        // Update subscriptions table
        await supabase
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

        // Also update the profile's subscription status
        await supabase
          .from('profiles')
          .update({
            subscription_status: tier,
            monthly_usage_count: tier === 'apprentice' ? null : 0, // Reset monthly count for new subscribers
            monthly_usage_reset_date: tier === 'alchemist' ? new Date() : null
          })
          .eq('id', userId);

        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        const deletedCustomer = await stripe.customers.retrieve(deletedSubscription.customer);
        const deletedUserId = deletedCustomer.metadata.supabase_uid;

        if (deletedUserId) {
          console.log(`Cancelling subscription for user ${deletedUserId}`);
          
          // Update subscription status
          await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              cancel_at_period_end: true,
            })
            .eq('user_id', deletedUserId);

          // Reset profile subscription status
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'apprentice',
              monthly_usage_count: null,
              monthly_usage_reset_date: null
            })
            .eq('id', deletedUserId);
        }
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
