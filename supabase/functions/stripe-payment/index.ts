
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.18.0?target=deno";
import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const PLANS = {
  'alchemist': {
    monthly: 'price_1Qs0CVGYVYFmwG4FmEwa1iWO',
    annual: 'price_1Qs0ECGYVYFmwG4FluFhUdQH'
  },
  'grandmaster': {
    monthly: 'price_1Qs0BTGYVYFmwG4FFDbYpi5v',
    annual: 'price_1Qs0BtGYVYFmwG4FrtkMrNNx'
  }
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check Stripe secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('Stripe secret key is not set');
      throw new Error('Payment system configuration error');
    }

    const { authorization } = req.headers;
    if (!authorization) {
      console.error('No authorization header provided');
      throw new Error('Authentication required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration');
      throw new Error('System configuration error');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authorization },
      },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('User authentication error:', userError);
      throw new Error('Authentication failed');
    }

    if (!user) {
      console.error('No user found');
      throw new Error('User not found');
    }

    // Parse request body
    const { planId, isAnnual } = await req.json();
    console.log('Received request for plan:', planId, 'isAnnual:', isAnnual);

    if (!planId || !PLANS[planId]) {
      console.error('Invalid plan ID:', planId);
      throw new Error(`Invalid plan selected`);
    }

    // Get or create Stripe customer
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      console.log('Creating new Stripe customer for user:', user.id);
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_uid: user.id,
        },
      });
      customerId = customer.id;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile with customer ID:', updateError);
        throw new Error('Failed to update user profile');
      }
    }

    const priceId = PLANS[planId][isAnnual ? 'annual' : 'monthly'];
    console.log('Creating checkout session with price ID:', priceId);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/alchemist-workshop?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/pricing`,
      subscription_data: {
        metadata: {
          supabase_uid: user.id,
        },
      },
    });

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ sessionUrl: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in payment function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500, // Changed from 400 to 500 for server errors
      }
    );
  }
});
