
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@12.18.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Stripe webhook function loaded");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16', // Use a stable API version
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get the signature from the header
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error("No Stripe signature found in request headers");
      return new Response(JSON.stringify({ error: 'No Stripe signature found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Get the webhook secret
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error("Stripe webhook secret not configured");
      return new Response(JSON.stringify({ error: 'Webhook secret missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const body = await req.text();
    console.log("Request body received, length:", body.length);

    // IMPORTANT: Use constructEventAsync instead of constructEvent
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
      console.log("Webhook event constructed successfully:", event.type);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log("Processing checkout.session.completed event");
        const session = event.data.object;
        
        // Retrieve more details about the session
        const checkoutSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items', 'subscription', 'customer'],
        });
        
        console.log("Checkout session details:", JSON.stringify({
          id: checkoutSession.id,
          customerId: checkoutSession.customer?.id,
          subscriptionId: checkoutSession.subscription?.id,
          status: checkoutSession.status,
        }));

        // Check if all required data is available
        if (!checkoutSession.customer || !checkoutSession.subscription) {
          console.error("Missing customer or subscription data in session");
          return new Response(JSON.stringify({ error: 'Missing customer or subscription data' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }

        // Get the subscription details
        const subscription = await stripe.subscriptions.retrieve(
          checkoutSession.subscription.id
        );
        
        console.log("Subscription details:", JSON.stringify({
          id: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          currentPeriod: {
            start: subscription.current_period_start,
            end: subscription.current_period_end,
          },
        }));

        // Determine the tier from the product ID
        const priceId = subscription.items.data[0]?.price.id;
        const productId = subscription.items.data[0]?.price.product;
        
        let tier = 'apprentice';
        if (productId) {
          const product = await stripe.products.retrieve(productId.toString());
          console.log("Product details:", JSON.stringify({
            id: product.id,
            name: product.name,
            metadata: product.metadata,
          }));
          
          // Extract tier from product metadata or name
          if (product.metadata.tier) {
            tier = product.metadata.tier;
          } else if (product.name.toLowerCase().includes('alchemist')) {
            tier = 'alchemist';
          } else if (product.name.toLowerCase().includes('grandmaster')) {
            tier = 'grandmaster';
          }
        }
        
        console.log(`Determined tier: ${tier}`);

        // Create Supabase client
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.4");
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseServiceKey) {
          console.error("Supabase credentials not configured");
          return new Response(JSON.stringify({ error: 'Database connection failed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Get user ID from Stripe customer ID
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single();
        
        let userData;
        if (profileError || !profileData) {
          console.error("Error fetching user profile:", profileError);
          
          // Try to find user by querying existing subscriptions
          const { data: subData, error: subError } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', subscription.customer)
            .single();
          
          if (subError || !subData) {
            console.error("Could not find user for this customer:", subscription.customer);
            return new Response(JSON.stringify({ error: 'User not found' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404,
            });
          }
          
          userData = { id: subData.user_id };
          console.log("Found user ID from subscriptions table:", userData.id);
        } else {
          userData = profileData;
          console.log("Found user ID from profiles table:", userData.id);
        }
        
        // Record the transaction and update subscription details
        try {
          // Use the RPC call with the updated function
          const { data: functionCallData, error: functionCallError } = await supabase.rpc(
            'update_subscription_and_transaction',
            {
              p_user_id: userData.id,
              p_stripe_customer_id: subscription.customer.toString(),
              p_stripe_subscription_id: subscription.id,
              p_status: subscription.status,
              p_tier: tier,
              p_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              p_cancel_at_period_end: subscription.cancel_at_period_end,
              p_stripe_session_id: session.id,
              p_amount: session.amount_total / 100, // Convert from cents to dollars
              p_currency: session.currency.toUpperCase(),
              p_payment_status: session.payment_status
            }
          );
          
          if (functionCallError) {
            console.error("Error updating subscription and transaction:", functionCallError);
            return new Response(JSON.stringify({ error: 'Database update failed' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            });
          }
          
          console.log("Successfully updated subscription and transaction data");
        } catch (dbError) {
          console.error("Exception during database update:", dbError);
          return new Response(JSON.stringify({ error: `Database exception: ${dbError.message}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        console.log("Processing customer.subscription.updated event");
        // Handle subscription updates (status changes, plan changes, etc.)
        const subscription = event.data.object;
        
        // Similar logic to checkout.session.completed but for updates
        // Update the subscription record in your database
        break;
      }
      
      case 'customer.subscription.deleted': {
        console.log("Processing customer.subscription.deleted event");
        // Handle subscription cancellation or expiration
        const subscription = event.data.object;
        
        // Update the user's subscription status in your database
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error(`Webhook processing error: ${err.message}`);
    return new Response(JSON.stringify({ error: `Webhook processing error: ${err.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
