
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import Stripe from "https://esm.sh/stripe@13.2.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

console.log("Hello from stripe-webhook Edge Function!");

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  httpClient: Stripe.createFetchHttpClient(),
});

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS for preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Only handle POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the request body
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    if (!signature) {
      console.error('No stripe signature found');
      return new Response(JSON.stringify({ error: 'No stripe signature found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the webhook signature
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') as string;
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log the event type for debugging
    console.log(`Processing webhook event: ${event.type}`);

    // Handle different event types
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object);
          break;
        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event.data.object);
          break;
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
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error(`Server error: ${error.message}`);
    return new Response(JSON.stringify({ error: `Server error: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to get the user ID from Stripe customer
async function getUserIdFromCustomer(customerId: string): Promise<string> {
  try {
    // First check if customer has metadata with user_id
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && customer.metadata && customer.metadata.user_id) {
      return customer.metadata.user_id;
    }

    // If no metadata, check in our database
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (error) {
      console.error('Error fetching user from Supabase:', error);
      throw new Error('No user ID found in customer metadata');
    }

    if (data && data.id) {
      // Update the customer metadata with the user_id for future reference
      await stripe.customers.update(customerId, {
        metadata: { user_id: data.id }
      });
      return data.id;
    }

    throw new Error('No user ID found in customer metadata');
  } catch (error) {
    console.error('Error getting user ID:', error);
    throw error;
  }
}

// Handle checkout.session.completed event
async function handleCheckoutSessionCompleted(session: any) {
  console.log('Processing checkout.session.completed event');
  
  if (!session.customer) {
    console.error('No customer ID in checkout session');
    throw new Error('No customer ID in checkout session');
  }

  // Get the user ID from the Stripe customer
  let userId;
  try {
    if (session.metadata && session.metadata.user_id) {
      userId = session.metadata.user_id;
    } else {
      userId = await getUserIdFromCustomer(session.customer);
    }
  } catch (error) {
    console.error('Error getting user ID:', error);
    throw error;
  }
  
  // Get subscription information
  const subscription = session.subscription 
    ? await stripe.subscriptions.retrieve(session.subscription)
    : null;
    
  if (!subscription) {
    console.error('No subscription in checkout session');
    throw new Error('No subscription in checkout session');
  }

  // Determine the plan tier from metadata or line items
  let planTier = 'apprentice';
  let isAnnual = false;

  if (session.metadata && session.metadata.plan_id) {
    planTier = session.metadata.plan_id;
    isAnnual = session.metadata.is_annual === 'true';
  } else if (subscription.metadata && subscription.metadata.plan_id) {
    planTier = subscription.metadata.plan_id;
    isAnnual = subscription.metadata.is_annual === 'true';
  }
  
  // Get payment information
  const paymentIntent = session.payment_intent 
    ? await stripe.paymentIntents.retrieve(session.payment_intent)
    : null;
  
  const amount = session.amount_total ? session.amount_total / 100 : 0;
  const currency = session.currency || 'usd';
  
  // Determine subscription period dates
  const currentPeriodStart = new Date(subscription.current_period_start * 1000);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  
  // Calculate next reset date - if annual, it's monthly from current date
  // If monthly, it's the same as current_period_end
  const nextResetDate = isAnnual 
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now for annual
    : currentPeriodEnd; // end of subscription period for monthly
  
  console.log(`User ${userId} subscribed to ${planTier} plan (${isAnnual ? 'annual' : 'monthly'})`);
  console.log(`Next reset date: ${nextResetDate.toISOString()}`);
  
  // Insert transaction record
  const { data: transactionData, error: transactionError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      stripe_session_id: session.id,
      stripe_subscription_id: subscription.id,
      amount: amount,
      currency: currency,
      status: 'succeeded',
      tier: planTier
    });
  
  if (transactionError) {
    console.error('Error inserting transaction record:', transactionError);
    throw new Error(`Failed to insert transaction record: ${transactionError.message}`);
  }
  
  // Update or insert subscription record
  const { data: subscriptionData, error: subscriptionError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: session.customer,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      tier: planTier,
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end
    });
  
  if (subscriptionError) {
    console.error('Error updating subscription record:', subscriptionError);
    throw new Error(`Failed to update subscription record: ${subscriptionError.message}`);
  }
  
  // Update the user's profile with the new subscription status and reset monthly usage
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .update({
      subscription_status: planTier,
      monthly_usage_count: 0, // Reset monthly usage count for new subscriptions
      monthly_usage_reset_date: nextResetDate.toISOString()
    })
    .eq('id', userId);
  
  if (profileError) {
    console.error('Error updating user profile:', profileError);
    throw new Error(`Failed to update user profile: ${profileError.message}`);
  }
  
  console.log('Successfully processed checkout.session.completed event');
}

// Handle customer.subscription.created event
async function handleSubscriptionCreated(subscription: any) {
  console.log('Processing customer.subscription.created event');
  
  // Get the user ID from the Stripe customer
  let userId;
  try {
    if (subscription.metadata && subscription.metadata.user_id) {
      userId = subscription.metadata.user_id;
    } else {
      userId = await getUserIdFromCustomer(subscription.customer);
    }
  } catch (error) {
    console.error('Error getting user ID:', error);
    throw error;
  }
  
  // Determine plan tier from metadata
  let planTier = 'apprentice';
  let isAnnual = false;
  
  if (subscription.metadata && subscription.metadata.plan_id) {
    planTier = subscription.metadata.plan_id;
    isAnnual = subscription.metadata.is_annual === 'true';
  }
  
  // Determine subscription period dates
  const currentPeriodStart = new Date(subscription.current_period_start * 1000);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  
  // Calculate next reset date
  const nextResetDate = isAnnual 
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now for annual
    : currentPeriodEnd; // end of subscription period for monthly
  
  console.log(`User ${userId} created subscription for ${planTier} plan (${isAnnual ? 'annual' : 'monthly'})`);
  
  // Update or insert subscription record
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      tier: planTier,
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end
    });
  
  if (subscriptionError) {
    console.error('Error updating subscription record:', subscriptionError);
    throw new Error(`Failed to update subscription record: ${subscriptionError.message}`);
  }
  
  // Update the user's profile with the new subscription status and reset monthly usage
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      subscription_status: planTier,
      monthly_usage_count: 0, // Reset monthly usage count for new subscriptions
      monthly_usage_reset_date: nextResetDate.toISOString()
    })
    .eq('id', userId);
  
  if (profileError) {
    console.error('Error updating user profile:', profileError);
    throw new Error(`Failed to update user profile: ${profileError.message}`);
  }
  
  console.log('Successfully processed customer.subscription.created event');
}

// Handle customer.subscription.updated event
async function handleSubscriptionUpdated(subscription: any) {
  console.log('Processing customer.subscription.updated event');
  
  // Get the user ID from the Stripe customer
  let userId;
  try {
    if (subscription.metadata && subscription.metadata.user_id) {
      userId = subscription.metadata.user_id;
    } else {
      userId = await getUserIdFromCustomer(subscription.customer);
    }
  } catch (error) {
    console.error('Error getting user ID:', error);
    throw error;
  }
  
  // Determine plan tier from metadata or items
  let planTier = 'apprentice';
  let isAnnual = false;
  
  if (subscription.metadata && subscription.metadata.plan_id) {
    planTier = subscription.metadata.plan_id;
    isAnnual = subscription.metadata.is_annual === 'true';
  }
  
  // Determine subscription period dates
  const currentPeriodStart = new Date(subscription.current_period_start * 1000);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  
  console.log(`User ${userId} updated subscription to ${planTier} plan (${isAnnual ? 'annual' : 'monthly'})`);
  
  // Update or insert subscription record
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      tier: planTier,
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end
    });
  
  if (subscriptionError) {
    console.error('Error updating subscription record:', subscriptionError);
    throw new Error(`Failed to update subscription record: ${subscriptionError.message}`);
  }
  
  // Update the user's profile with the new subscription status
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      subscription_status: planTier
    })
    .eq('id', userId);
  
  if (profileError) {
    console.error('Error updating user profile:', profileError);
    throw new Error(`Failed to update user profile: ${profileError.message}`);
  }
  
  console.log('Successfully processed customer.subscription.updated event');
}

// Handle customer.subscription.deleted event
async function handleSubscriptionDeleted(subscription: any) {
  console.log('Processing customer.subscription.deleted event');
  
  // Get the user ID from the Stripe customer
  let userId;
  try {
    if (subscription.metadata && subscription.metadata.user_id) {
      userId = subscription.metadata.user_id;
    } else {
      userId = await getUserIdFromCustomer(subscription.customer);
    }
  } catch (error) {
    console.error('Error getting user ID:', error);
    throw error;
  }
  
  console.log(`User ${userId} subscription was deleted`);
  
  // Update or insert subscription record
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      status: 'canceled',
      tier: 'apprentice',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: true
    });
  
  if (subscriptionError) {
    console.error('Error updating subscription record:', subscriptionError);
    throw new Error(`Failed to update subscription record: ${subscriptionError.message}`);
  }
  
  // Downgrade the user's profile to apprentice when subscription is canceled/deleted
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'apprentice',
      monthly_usage_reset_date: null
    })
    .eq('id', userId);
  
  if (profileError) {
    console.error('Error updating user profile:', profileError);
    throw new Error(`Failed to update user profile: ${profileError.message}`);
  }
  
  console.log('Successfully processed customer.subscription.deleted event');
}

// Handle invoice.payment_succeeded event
async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log('Processing invoice.payment_succeeded event');
  
  if (!invoice.customer || !invoice.subscription) {
    console.log('Invoice has no customer or subscription ID');
    return;
  }
  
  // Get the user ID from the Stripe customer
  let userId;
  try {
    if (invoice.metadata && invoice.metadata.user_id) {
      userId = invoice.metadata.user_id;
    } else {
      userId = await getUserIdFromCustomer(invoice.customer);
    }
  } catch (error) {
    console.error('Error getting user ID:', error);
    throw error;
  }
  
  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  
  // Determine plan tier from subscription metadata
  let planTier = 'apprentice';
  let isAnnual = false;
  
  if (subscription.metadata && subscription.metadata.plan_id) {
    planTier = subscription.metadata.plan_id;
    isAnnual = subscription.metadata.is_annual === 'true';
  }
  
  // Get amount and currency
  const amount = invoice.amount_paid ? invoice.amount_paid / 100 : 0;
  const currency = invoice.currency || 'usd';
  
  console.log(`User ${userId} paid invoice ${invoice.id} for ${planTier} plan (${amount} ${currency})`);
  
  // Insert transaction record for the payment
  const { error: transactionError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      stripe_session_id: null,
      stripe_subscription_id: invoice.subscription,
      amount: amount,
      currency: currency,
      status: 'succeeded',
      tier: planTier
    });
  
  if (transactionError) {
    console.error('Error inserting transaction record:', transactionError);
    throw new Error(`Failed to insert transaction record: ${transactionError.message}`);
  }
  
  // Calculate next reset date
  const currentPeriodStart = new Date(subscription.current_period_start * 1000);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  
  const nextResetDate = isAnnual 
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now for annual
    : currentPeriodEnd; // end of subscription period for monthly
  
  // Reset the user's monthly usage count when a new invoice is paid
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      monthly_usage_count: 0,
      monthly_usage_reset_date: nextResetDate.toISOString()
    })
    .eq('id', userId);
  
  if (profileError) {
    console.error('Error updating user profile:', profileError);
    throw new Error(`Failed to update user profile: ${profileError.message}`);
  }
  
  console.log('Successfully processed invoice.payment_succeeded event');
}

// Handle invoice.payment_failed event
async function handleInvoicePaymentFailed(invoice: any) {
  console.log('Processing invoice.payment_failed event');
  
  if (!invoice.customer || !invoice.subscription) {
    console.log('Invoice has no customer or subscription ID');
    return;
  }
  
  // Get the user ID from the Stripe customer
  let userId;
  try {
    if (invoice.metadata && invoice.metadata.user_id) {
      userId = invoice.metadata.user_id;
    } else {
      userId = await getUserIdFromCustomer(invoice.customer);
    }
  } catch (error) {
    console.error('Error getting user ID:', error);
    throw error;
  }
  
  console.log(`User ${userId} failed payment for invoice ${invoice.id}`);
  
  // We don't immediately downgrade the subscription, since Stripe will retry
  // payment collection. We could log the failed payment or send a notification.
  
  // Log the failed payment attempt in transactions table
  const { error: transactionError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      stripe_session_id: null,
      stripe_subscription_id: invoice.subscription,
      amount: invoice.amount_due ? invoice.amount_due / 100 : 0,
      currency: invoice.currency || 'usd',
      status: 'failed',
      tier: 'unknown' // We don't know the tier at this point
    });
  
  if (transactionError) {
    console.error('Error inserting transaction record:', transactionError);
    throw new Error(`Failed to insert transaction record: ${transactionError.message}`);
  }
  
  console.log('Successfully processed invoice.payment_failed event');
}
