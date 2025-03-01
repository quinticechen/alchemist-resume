
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.6.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not set in environment variables');
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Stripe with the secret key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Get the request body
    const { planId, isAnnual } = await req.json();
    
    // Get the user ID from the JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Extract JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Decode JWT to get user ID
    // Note: This is a simple decode, not verification since Supabase already handles that
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Decode the payload
    const payload = JSON.parse(atob(tokenParts[1]));
    const userId = payload.sub;
    
    console.log(`Creating checkout session for user ${userId}, plan ${planId}, isAnnual: ${isAnnual}`);

    // Define plan prices based on ID and billing cycle
    const prices = {
      alchemist: {
        monthly: 'price_alchemist_monthly',
        annual: 'price_alchemist_annual',
      },
      grandmaster: {
        monthly: 'price_grandmaster_monthly',
        annual: 'price_grandmaster_annual',
      },
    };

    // Get the price ID
    const priceId = prices[planId]?.[isAnnual ? 'annual' : 'monthly'];
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan ID or billing cycle' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/pricing`,
      customer_email: payload.email,
      client_reference_id: userId,
      metadata: {
        user_id: userId,
      },
    });

    // Return session URL
    return new Response(
      JSON.stringify({ sessionUrl: session.url }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error.message);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create checkout session',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
