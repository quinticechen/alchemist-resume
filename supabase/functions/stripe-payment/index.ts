
// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";
import Stripe from "https://esm.sh/stripe@12.18.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from stripe-payment Edge Function!");

serve(async (req) => {
  console.log(`Received ${req.method} request to stripe-payment function`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // Check if it's a POST request
    if (req.method !== 'POST') {
      console.error(`Invalid method: ${req.method}`);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get JWT token from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
      console.log(`Request data:`, JSON.stringify(requestData));
    } catch (err) {
      console.error("Error parsing request body:", err);
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { planId, priceId, isAnnual } = requestData;
    
    if (!planId || !priceId) {
      console.error("Missing planId or priceId in request");
      return new Response(JSON.stringify({ error: 'Missing plan or price information' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Supabase URL and service role key from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not set in environment variables");
      return new Response(JSON.stringify({ error: 'Stripe configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract user ID from JWT token
    const token = authHeader.replace('Bearer ', '');
    console.log(`Authenticating user with token: ${token.substring(0, 15)}...`);
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the token and get user data
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    console.log(`Authenticated user ID: ${userId}`);

    // Get user profile information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return new Response(JSON.stringify({ error: 'Error fetching user profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userEmail = user.email;
    let stripeCustomerId = profile?.stripe_customer_id;

    console.log(`Processing payment for user: ${userId}, email: ${userEmail}, plan: ${planId} (${isAnnual ? 'annual' : 'monthly'})`);

    try {
      // Initialize Stripe with a compatible API version
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
        httpClient: Stripe.createFetchHttpClient(),
      });

      // Create Stripe customer if not exists
      if (!stripeCustomerId) {
        console.log("Creating new Stripe customer");
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

        console.log(`Created new Stripe customer with ID: ${stripeCustomerId}`);
      }

      // Calculate success URL
      const origin = req.headers.get('origin') || 'https://resumealchemist.qwizai.com';
      const successUrl = new URL(`${origin}/payment-success`);
      
      // Add plan and is_annual as query parameters
      successUrl.searchParams.append('plan', planId);
      successUrl.searchParams.append('is_annual', isAnnual.toString());

      const successUrlString = successUrl.toString();
      console.log(`Success URL base: ${successUrlString}`);

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
        },
        subscription_data: {
          metadata: {
            user_id: userId,
            plan_id: planId,
            is_annual: isAnnual.toString(),
          },
        },
      });

      console.log(`Created checkout session with ID: ${session.id}`);

      return new Response(JSON.stringify({ sessionUrl: session.url }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      return new Response(JSON.stringify({ 
        error: stripeError.message || 'Error creating checkout session',
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Unexpected error in stripe-payment edge function:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
