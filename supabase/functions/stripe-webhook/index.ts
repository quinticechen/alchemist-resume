
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
      // console.error("No Stripe signature found in request headers");
      return new Response(JSON.stringify({ error: 'No Stripe signature found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Get the webhook secret
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      // console.error("Stripe webhook secret not configured");
      return new Response(JSON.stringify({ error: 'Webhook secret missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const body = await req.text();
    // console.log("Request body received, length:", body.length);

    // IMPORTANT: Use constructEventAsync instead of constructEvent
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
      // console.log("Webhook event constructed successfully:", event.type);
    } catch (err) {
      // console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        // console.log("Processing checkout.session.completed event");
        const session = event.data.object;
        
        // Retrieve more details about the session
        const checkoutSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items', 'subscription', 'customer'],
        });
        
        // console.log("Checkout session details:", JSON.stringify({
        //   id: checkoutSession.id,
        //   customerId: checkoutSession.customer?.id,
        //   subscriptionId: checkoutSession.subscription?.id,
        //   status: checkoutSession.status,
        // }));

        // Check if all required data is available
        if (!checkoutSession.customer || !checkoutSession.subscription) {
          // console.error("Missing customer or subscription data in session");
          return new Response(JSON.stringify({ error: 'Missing customer or subscription data' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }

        // Get the subscription details
        const subscription = await stripe.subscriptions.retrieve(
          checkoutSession.subscription.id
        );
        
        // console.log("Subscription details:", JSON.stringify({
        //   id: subscription.id,
        //   customerId: subscription.customer,
        //   status: subscription.status,
        //   currentPeriod: {
        //     start: subscription.current_period_start,
        //     end: subscription.current_period_end,
        //   },
        // }));

        // Determine the tier from the product ID
        const priceId = subscription.items.data[0]?.price.id;
        const productId = subscription.items.data[0]?.price.product;
        
        let tier = 'apprentice';
        if (productId) {
          const product = await stripe.products.retrieve(productId.toString());
          // console.log("Product details:", JSON.stringify({
          //   id: product.id,
          //   name: product.name,
          //   metadata: product.metadata,
          // }));
          
          // Extract tier from product metadata or name
          if (product.metadata.tier) {
            tier = product.metadata.tier;
          } else if (product.name.toLowerCase().includes('alchemist')) {
            tier = 'alchemist';
          } else if (product.name.toLowerCase().includes('grandmaster')) {
            tier = 'grandmaster';
          }
        }
        
        // console.log(`Determined tier: ${tier}`);
        
        // Determine payment period (monthly or annual)
        let payment_period = 'monthly';
        const interval = subscription.items.data[0]?.price.recurring?.interval;
        
        if (interval === 'year') {
          payment_period = 'annual';
        }
        
        // console.log(`Determined payment period: ${payment_period}`);

        // Create Supabase client
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.4");
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseServiceKey) {
          // console.error("Supabase credentials not configured");
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
          // console.error("Error fetching user profile:", profileError);
          
          // Try to find user by querying existing subscriptions
          const { data: subData, error: subError } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', subscription.customer)
            .single();
          
          if (subError || !subData) {
            // console.error("Could not find user for this customer:", subscription.customer);
            return new Response(JSON.stringify({ error: 'User not found' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404,
            });
          }
          
          userData = { id: subData.user_id };
          // console.log("Found user ID from subscriptions table:", userData.id);
        } else {
          userData = profileData;
          // console.log("Found user ID from profiles table:", userData.id);
        }
        
        // Create a custom function to update subscription with payment period
        const updateSubscriptionWithPaymentPeriod = async () => {
          try {
            const { data, error } = await supabase
              .from('subscriptions')
              .upsert({
                user_id: userData.id,
                stripe_customer_id: subscription.customer.toString(),
                stripe_subscription_id: subscription.id,
                status: subscription.status,
                tier: tier,
                payment_period: payment_period,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end
              }, { onConflict: 'user_id' });
              
            if (error) {
              // console.error("Error updating subscription:", error);
              throw error;
            }
            
            return data;
          } catch (err) {
            console.error("Exception updating subscription:", err);
            throw err;
          }
        };
        
        // Record the transaction and update subscription details
        try {
          // First update the subscription with payment period
          await updateSubscriptionWithPaymentPeriod();
          
          // Then create the transaction record with payment_period
          const { data: transactionData, error: transactionError } = await supabase
            .from('transactions')
            .insert({
              user_id: userData.id,
              stripe_session_id: session.id,
              stripe_subscription_id: subscription.id,
              amount: session.amount_total / 100, // Convert from cents to dollars
              currency: session.currency.toUpperCase(),
              status: session.payment_status,
              tier: tier,
              payment_period: payment_period // Add payment period to transaction record
            });
            
          if (transactionError) {
            // console.error("Error inserting transaction:", transactionError);
            // Continue execution even if transaction insert fails
          }
          
          // Update profiles table with payment_period
          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({
              subscription_status: tier,
              payment_period: payment_period,
              monthly_usage_reset_date: new Date(subscription.current_period_end * 1000).toISOString(),
              monthly_usage_count: tier === 'apprentice' ? null : 0  // Reset monthly usage count for paid tiers
            })
            .eq('id', userData.id);
            
          if (profileUpdateError) {
            // console.error("Error updating profile:", profileUpdateError);
            // Continue execution even if profile update fails
          }
          
          // console.log("Successfully updated subscription and transaction data");
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
        // console.log("Processing customer.subscription.updated event");
        const subscription = event.data.object;
        
        // Determine payment period (monthly or annual)
        let payment_period = 'monthly';
        const interval = subscription.items.data[0]?.price.recurring?.interval;
        
        if (interval === 'year') {
          payment_period = 'annual';
        }
        
        // console.log(`Subscription updated - Payment period: ${payment_period}`);
        
        // Create Supabase client
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.4");
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseServiceKey) {
          // console.error("Supabase credentials not configured");
          return new Response(JSON.stringify({ error: 'Database connection failed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Find the subscription in the database
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();
          
        if (subError || !subData) {
          // console.error("Could not find subscription:", subscription.id);
          return new Response(JSON.stringify({ error: 'Subscription not found' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          });
        }
        
        // Update the subscription
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            payment_period: payment_period,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);
          
        if (updateError) {
          // console.error("Error updating subscription:", updateError);
          return new Response(JSON.stringify({ error: 'Error updating subscription' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }
        
        // Also update the profile with payment_period
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            payment_period: payment_period
          })
          .eq('id', subData.user_id);
          
        if (profileUpdateError) {
          // console.error("Error updating profile payment period:", profileUpdateError);
          // Continue execution even if profile update fails
        }
        
        // console.log("Successfully updated subscription");
        break;
      }
      
      case 'customer.subscription.deleted': {
        // console.log("Processing customer.subscription.deleted event");
        const subscription = event.data.object;
        
        // Create Supabase client
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.4");
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseServiceKey) {
          // console.error("Supabase credentials not configured");
          return new Response(JSON.stringify({ error: 'Database connection failed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Find the subscription in the database
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();
          
        if (subError || !subData) {
          // console.error("Could not find subscription:", subscription.id);
          return new Response(JSON.stringify({ error: 'Subscription not found' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          });
        }
        
        // Update the subscription status
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);
          
        if (updateError) {
          // console.error("Error updating subscription status:", updateError);
        }
        
        // Reset user to apprentice tier and clear payment_period
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'apprentice',
            payment_period: null
          })
          .eq('id', subData.user_id);
          
        if (profileError) {
          // console.error("Error updating profile subscription status:", profileError);
        }
        
        // console.log("Successfully processed subscription cancellation");
        break;
      }
      
      default:
        // console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    // console.error(`Webhook processing error: ${err.message}`);
    return new Response(JSON.stringify({ error: `Webhook processing error: ${err.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
