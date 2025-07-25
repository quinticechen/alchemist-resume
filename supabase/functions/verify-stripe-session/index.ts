
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import Stripe from "https://esm.sh/stripe@13.2.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Only handle POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract environment from request headers
    const origin = req.headers.get('origin') || '';
    const xEnvironment = req.headers.get('x-environment');
    
    // Determine environment based on headers
    let environment = 'staging';
    
    // First check if x-environment header was sent (highest priority)
    if (xEnvironment) {
      environment = xEnvironment;
    }
    // If not, fallback to origin detection
    else if (origin.includes('resumealchemist.com') || origin.includes('resumealchemist.qwizai.com')) {
      environment = 'production';
    } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      environment = 'development';
    } else if (origin.includes('staging.resumealchemist')) {
      environment = 'staging';
    } else if (origin.includes('vercel.app')) {
      // Check if it's a preview deployment
      if (origin.includes('-git-') || origin.includes('-pr-')) {
        environment = 'preview';
      }
    }
    
    // Get appropriate secret key based on environment
    const stripeSecretKey = environment === 'production'
      ? Deno.env.get('STRIPE_SECRET_KEY_PRODUCTION')
      : Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Stripe configuration error' 
      }), {
        status: 200, // Use 200 to ensure frontend receives the error
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Initialize Stripe with the appropriate key
    const stripe = new Stripe(stripeSecretKey, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get the session ID from the request body
    const { sessionId } = await req.json();
    if (!sessionId) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing session ID' 
      }), {
        status: 200, // Use 200 status for all responses to ensure client sees the message
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if session ID is the placeholder value and return a helpful error
    if (sessionId === '{CHECKOUT_SESSION_ID}') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid session ID: received placeholder {CHECKOUT_SESSION_ID} instead of actual session ID' 
      }), {
        status: 200, // Use 200 to ensure frontend receives the error
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // First check if we already have a transaction record for this session
    const { data: existingTransaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();

    if (existingTransaction) {
      // Make sure we pass all necessary data and indicate success
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Transaction already recorded',
        plan: existingTransaction.tier,
        isAnnual: existingTransaction.payment_period === 'annual',
        userId: existingTransaction.user_id,
        sessionId: sessionId,
        transactionData: existingTransaction,
        environment: environment
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      // Retrieve the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (!session) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid session ID' 
        }), {
          status: 200, // Use 200 to ensure frontend receives the error
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if the session was paid
      if (session.payment_status !== 'paid') {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Payment not completed' 
        }), {
          status: 200, // Use 200 to ensure frontend receives the error
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get additional information from the session
      const planId = session.metadata?.plan_id || 'unknown';
      const isAnnual = session.metadata?.is_annual === 'true';
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;
      // Check if environment is specified in metadata
      const sessionEnvironment = session.metadata?.environment || environment;

      // Retrieve the user ID from the customer metadata or from our database
      let userId;
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer && !customer.deleted && customer.metadata && customer.metadata.user_id) {
          userId = customer.metadata.user_id;
        } else {
          // Look up the user from our database, checking the appropriate customer ID field
          const customerField = sessionEnvironment === 'production' ? 'stripe_customer_id_production' : 'stripe_customer_id';
          const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq(customerField, customerId)
            .single();

          if (error || !data) {
            throw new Error('Could not find user associated with Stripe customer');
          }

          userId = data.id;

          // Update the customer metadata for future reference
          await stripe.customers.update(customerId, {
            metadata: { user_id: userId }
          });
        }
      } catch (error) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Could not verify user' 
        }), {
          status: 200, // Use 200 to ensure frontend receives the error
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Return success with additional information
      return new Response(JSON.stringify({
        success: true,
        plan: planId,
        isAnnual: isAnnual,
        userId: userId,
        sessionId: sessionId,
        environment: sessionEnvironment,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (stripeError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Stripe API error: ${stripeError.message}` 
      }), {
        status: 200, // Use 200 to ensure frontend receives the error
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 200, // Use 200 to ensure frontend receives the error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
