
// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";
import Stripe from "https://esm.sh/stripe@12.18.0";
import { corsHeaders } from "../_shared/cors.ts";

const determineEnvironment = (req: Request): string => {
  // Extract environment from request headers
  const origin = req.headers.get('origin') || '';
  const xEnvironment = req.headers.get('x-environment');
  
  // First check if x-environment header was sent (highest priority)
  if (xEnvironment) {
    console.log(`Using environment from x-environment header: ${xEnvironment}`);
    return xEnvironment;
  }
  
  // If not, fallback to origin detection
  if (origin.includes('resumealchemist.com') || origin.includes('resumealchemist.qwizai.com')) {
    console.log('Detected production environment from origin');
    return 'production';
  } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    console.log('Detected development environment from origin');
    return 'development';
  } else if (origin.includes('staging.resumealchemist')) {
    console.log('Detected staging environment from origin');
    return 'staging';
  } else if (origin.includes('vercel.app')) {
    // Check if it's a preview deployment
    if (origin.includes('-git-') || origin.includes('-pr-')) {
      console.log('Detected preview environment from origin');
      return 'preview';
    }
  }
  
  console.log('Defaulting to staging environment');
  return 'staging';
};

const getStripeSecretKey = (environment: string): string | null => {
  const key = environment === 'production'
    ? Deno.env.get('STRIPE_SECRET_KEY_PRODUCTION')
    : Deno.env.get('STRIPE_SECRET_KEY');
    
  if (!key) {
    console.error(`No Stripe secret key found for environment: ${environment}`);
    return null;
  }
  
  console.log(`Successfully retrieved Stripe secret key for environment: ${environment}`);
  return key;
};

const validateRequestData = (data: any) => {
  if (!data.planId || !data.priceId) {
    return { isValid: false, error: 'Missing plan or price information' };
  }
  return { isValid: true, error: null };
};

serve(async (req) => {
  console.log(`Received ${req.method} request to stripe-payment function`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // Check if it's a POST request
    if (req.method !== 'POST') {
      console.log(`Rejecting ${req.method} request - only POST is allowed`);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get JWT token from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.log('Rejecting request - no authorization header');
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine environment
    const environment = determineEnvironment(req);
    
    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
      console.log('Request data:', JSON.stringify({
        planId: requestData.planId,
        isAnnual: requestData.isAnnual,
        environment
      }));
    } catch (err) {
      console.error('Error parsing request body:', err);
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Validate request data
    const { isValid, error: validationError } = validateRequestData(requestData);
    if (!isValid) {
      console.log(`Validation error: ${validationError}`);
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { planId, priceId, isAnnual } = requestData;

    // Get Supabase URL and service role key from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Select the appropriate Stripe secret key based on environment
    const stripeSecretKey = getStripeSecretKey(environment);

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!stripeSecretKey) {
      console.error(`Missing Stripe configuration for environment: ${environment}`);
      return new Response(JSON.stringify({ 
        error: `Stripe configuration error for environment: ${environment}. Please ensure you have set up your Stripe keys.` 
      }), {
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
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    console.log(`Authenticated user: ${userId}`);

    // Get user profile information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return new Response(JSON.stringify({ error: 'Error fetching user profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userEmail = user.email;
    let stripeCustomerId = profile?.stripe_customer_id;
    console.log(`User email: ${userEmail}, Stripe customer ID: ${stripeCustomerId || 'not set'}`);

    try {
      // Initialize Stripe with a compatible API version
      console.log(`Initializing Stripe for environment: ${environment}`);
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
        httpClient: Stripe.createFetchHttpClient(),
      });

      // Create Stripe customer if not exists
      if (!stripeCustomerId) {
        console.log('Creating new Stripe customer');
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            user_id: userId
          }
        });
        stripeCustomerId = customer.id;
        console.log(`Created Stripe customer: ${stripeCustomerId}`);

        // Update profile with Stripe customer ID
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Error updating profile with Stripe customer ID:', updateError);
        }
      }

      // Calculate success URL
      const origin = req.headers.get('origin') || 'https://resumealchemist.qwizai.com';
      const successUrl = new URL(`${origin}/payment-success`);
      
      // Add plan and is_annual as query parameters
      successUrl.searchParams.append('plan', planId);
      successUrl.searchParams.append('is_annual', isAnnual.toString());

      const successUrlString = successUrl.toString();
      console.log(`Success URL: ${successUrlString}`);

      // Create Stripe Checkout Session
      console.log(`Creating checkout session for price: ${priceId}, environment: ${environment}`);
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
        success_url: `${successUrlString}&session_id={CHECKOUT_SESSION_ID}`,
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

      console.log(`Checkout session created: ${session.id}`);
      return new Response(JSON.stringify({ sessionUrl: session.url }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError);
      return new Response(JSON.stringify({ 
        error: stripeError.message || 'Error creating checkout session',
        details: environment === 'production' ? 'Stripe production configuration error' : stripeError
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: 'An unexpected error occurred',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
