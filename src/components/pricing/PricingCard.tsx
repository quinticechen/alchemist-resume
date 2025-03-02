import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.6.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name, x-environment',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Define the price IDs as constants based on provided data
const PLANS = {
  alchemist: {
    monthly: 'price_1Qs0CVGYVYFmwG4FmEwa1iWO',
    annual: 'price_1Qs0ECGYVYFmwG4FluFhUdQH',
  },
  grandmaster: {
    monthly: 'price_1Qs0BTGYVYFmwG4FFDbYpi5v',
    annual: 'price_1Qs0BtGYVYFmwG4FrtkMrNNx',
  },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Stripe secret key from environment
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not set in environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Parse request body
    const { planId, isAnnual } = await req.json();

    // Get JWT token from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate JWT token and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Processing payment request for user: ${user.id}, plan: ${planId}, annual: ${isAnnual}`);

    // Check if user already has a Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Error fetching user profile' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId = profile?.stripe_customer_id;
    
    if (!stripeCustomerId) {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_uid: user.id
        }
      });
      
      stripeCustomerId = customer.id;
      
      // Update the user's profile with the Stripe customer ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Error updating profile with Stripe customer ID:', updateError);
      }
    }

    // Set up price ID based on plan and billing frequency
    let priceId;
    const origin = req.headers.get('origin') || 'https://resumealchemist.qwizai.com';
    let successUrl = `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}&is_annual=${isAnnual}`;
    let cancelUrl = `${origin}/pricing`;

    // Determine price ID based on plan and billing frequency
    if (planId === 'alchemist') {
      priceId = isAnnual ? PLANS.alchemist.annual : PLANS.alchemist.monthly;
    } else if (planId === 'grandmaster') {
      priceId = isAnnual ? PLANS.grandmaster.annual : PLANS.grandmaster.monthly;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid plan selected' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        planId: planId,
        isAnnual: isAnnual ? 'true' : 'false'
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    console.log(`Created checkout session: ${session.id} for user: ${user.id}`);

    // Return session URL
    return new Response(
      JSON.stringify({ sessionUrl: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in stripe-payment function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});