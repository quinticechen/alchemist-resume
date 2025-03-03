
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Define CORS headers for cross-origin requests
// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-environment',
// };

console.log("Hello from stripe-webhook Edge Function!");

// Get environment variables
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!stripeSecretKey || !stripeWebhookSecret) {
  console.error("STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not set");
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
}

serve(async (req) => {
  console.log(`Received ${req.method} request to stripe-webhook function`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      console.error(`Invalid method: ${req.method}`);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the request body
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error("No Stripe signature in request headers");
      return new Response(JSON.stringify({ error: 'No Stripe signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Import Stripe only when needed
    const { default: Stripe } = await import("https://esm.sh/stripe@13.2.0?target=deno");
    const stripe = new Stripe(stripeSecretKey, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Construct the event from payload and signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        stripeWebhookSecret
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing Stripe event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`Checkout session completed: ${session.id}`);
        
        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id;
        const isAnnual = session.metadata?.is_annual === 'true';
        
        if (!userId) {
          throw new Error('No user ID found in session metadata');
        }
        
        if (!planId) {
          throw new Error('No plan ID found in session metadata');
        }
        
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        // Update subscription and transaction in database
        await updateSubscriptionAndTransaction(
          userId,
          session.customer,
          subscription.id,
          subscription.status,
          planId,
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000),
          subscription.cancel_at_period_end,
          session.id,
          session.amount_total / 100, // Convert from cents to dollars
          session.currency,
          'completed'
        );
        
        console.log(`Successfully processed checkout.session.completed for user ${userId}`);
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log(`Subscription updated: ${subscription.id}`);
        
        // Get user ID from metadata
        const userId = subscription.metadata?.user_id;
        
        if (!userId) {
          // Try to get user ID from customer metadata
          const customer = await stripe.customers.retrieve(subscription.customer);
          if (!customer.metadata?.user_id) {
            throw new Error('No user ID found in customer metadata');
          }
          
          // Use user ID from customer metadata
          await updateSubscriptionStatus(
            customer.metadata.user_id,
            subscription.customer,
            subscription.id,
            subscription.status,
            subscription.items.data[0]?.price?.metadata?.tier || 'unknown',
            new Date(subscription.current_period_start * 1000),
            new Date(subscription.current_period_end * 1000),
            subscription.cancel_at_period_end
          );
        } else {
          // Use user ID from subscription metadata
          await updateSubscriptionStatus(
            userId,
            subscription.customer,
            subscription.id,
            subscription.status,
            subscription.items.data[0]?.price?.metadata?.tier || 'unknown',
            new Date(subscription.current_period_start * 1000),
            new Date(subscription.current_period_end * 1000),
            subscription.cancel_at_period_end
          );
        }
        
        console.log(`Successfully processed customer.subscription.updated`);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log(`Subscription deleted: ${subscription.id}`);
        
        // Get user ID from metadata
        let userId = subscription.metadata?.user_id;
        
        if (!userId) {
          // Try to get user ID from customer metadata
          const customer = await stripe.customers.retrieve(subscription.customer);
          userId = customer.metadata?.user_id;
          
          if (!userId) {
            throw new Error('No user ID found in customer or subscription metadata');
          }
        }
        
        // Update subscription in database
        await updateSubscriptionStatus(
          userId,
          subscription.customer,
          subscription.id,
          'canceled',
          'apprentice', // Revert to free tier
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000),
          true
        );
        
        console.log(`Successfully processed customer.subscription.deleted`);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`Webhook error: ${error.message}`);
    return new Response(JSON.stringify({ error: `Webhook error: ${error.message}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Function to update subscription status in database
async function updateSubscriptionStatus(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  status: string,
  tier: string,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: boolean
) {
  console.log(`Updating subscription status for user ${userId} to ${tier}`);
  
  try {
    // Update subscriptions table
    const subscriptionResponse = await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        status: status,
        tier: tier,
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        cancel_at_period_end: cancelAtPeriodEnd,
      }),
    });
    
    if (!subscriptionResponse.ok) {
      console.error(`Failed to update subscription: ${subscriptionResponse.status} ${subscriptionResponse.statusText}`);
      throw new Error('Failed to update subscription');
    }
    
    // Update profiles table with subscription status
    const profilesResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        subscription_status: tier,
        monthly_usage_reset_date: currentPeriodEnd.toISOString(),
        monthly_usage_count: tier === 'alchemist' || tier === 'grandmaster' ? 0 : null
      }),
    });
    
    if (!profilesResponse.ok) {
      console.error(`Failed to update profile: ${profilesResponse.status} ${profilesResponse.statusText}`);
      throw new Error('Failed to update profile');
    }
    
    console.log(`Successfully updated subscription status for user ${userId}`);
  } catch (error) {
    console.error(`Error updating subscription status: ${error.message}`);
    throw error;
  }
}

// Function to update subscription and transaction in database
async function updateSubscriptionAndTransaction(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  status: string,
  tier: string,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: boolean,
  stripeSessionId: string,
  amount: number,
  currency: string,
  paymentStatus: string
) {
  console.log(`Updating subscription and transaction for user ${userId}`);
  
  try {
    // Update subscription status
    await updateSubscriptionStatus(
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      status,
      tier,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd
    );
    
    // Create transaction record
    const transactionResponse = await fetch(`${supabaseUrl}/rest/v1/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        user_id: userId,
        stripe_session_id: stripeSessionId,
        stripe_subscription_id: stripeSubscriptionId,
        amount: amount,
        currency: currency,
        status: paymentStatus,
        subscription_tier: tier
      }),
    });
    
    if (!transactionResponse.ok) {
      console.error(`Failed to create transaction: ${transactionResponse.status} ${transactionResponse.statusText}`);
      throw new Error('Failed to create transaction');
    }
    
    console.log(`Successfully created transaction record for user ${userId}`);
  } catch (error) {
    console.error(`Error updating subscription and transaction: ${error.message}`);
    throw error;
  }
}
