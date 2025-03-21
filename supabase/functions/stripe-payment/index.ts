
// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";
import Stripe from "https://esm.sh/stripe@12.18.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // Check if it's a POST request
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get JWT token from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
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

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { planId, priceId, isAnnual } = requestData;
    
    if (!planId || !priceId) {
      return new Response(JSON.stringify({ error: 'Missing plan or price information' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Supabase URL and service role key from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Select the appropriate Stripe secret key based on environment
    const stripeSecretKey = environment === 'production'
      ? Deno.env.get('STRIPE_SECRET_KEY_PRODUCTION')
      : Deno.env.get('STRIPE_SECRET_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ error: 'Stripe configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract user ID from JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the token and get user data
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    // Get user profile information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      return new Response(JSON.stringify({ error: 'Error fetching user profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userEmail = user.email;
    let stripeCustomerId = profile?.stripe_customer_id;

    try {
      // Initialize Stripe with a compatible API version
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
        httpClient: Stripe.createFetchHttpClient(),
      });

      // Create Stripe customer if not exists
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            user_id: userId
          }
        });
        stripeCustomerId = customer.id;

        // Update profile with Stripe customer ID
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', userId);
      }

      // Calculate success URL
      const origin = req.headers.get('origin') || 'https://resumealchemist.qwizai.com';
      const successUrl = new URL(`${origin}/payment-success`);
      
      // Add plan and is_annual as query parameters
      successUrl.searchParams.append('plan', planId);
      successUrl.searchParams.append('is_annual', isAnnual.toString());

      const successUrlString = successUrl.toString();

      // Create Stripe Checkout Session with the session_id parameter automatically handled by Stripe
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${successUrlString}&session_id={CHECKOUT_SESSION_ID}`, // Use & instead of ? for proper URL params
        cancel_url: `${origin}/pricing?canceled=true`,
        metadata: {
          user_id: userId,
          plan_id: planId,
          is_annual: isAnnual.toString(),
          payment_period: isAnnual ? 'annual' : 'monthly',
          environment: environment
        },
        subscription_data: {
          metadata: {
            user_id: userId,
            plan_id: planId,
            is_annual: isAnnual.toString(),
            payment_period: isAnnual ? 'annual' : 'monthly',
            environment: environment
          },
        },
      });

      return new Response(JSON.stringify({ sessionUrl: session.url }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (stripeError) {
      return new Response(JSON.stringify({ 
        error: stripeError.message || 'Error creating checkout session',
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
