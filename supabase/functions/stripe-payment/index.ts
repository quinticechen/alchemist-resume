// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "stripe";

// Define CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-environment',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

console.log("Hello from stripe-payment Edge Function!");

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: "2020-08-27",
});

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
    
    const { planId, isAnnual } = requestData;
    
    if (!planId) {
      console.error("Missing planId in request");
      return new Response(JSON.stringify({ error: 'Missing plan information' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Stripe secret key from environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not set in environment variables");
      return new Response(JSON.stringify({ error: 'Stripe configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate success URL
    const origin = req.headers.get('origin') || 'https://resumealchemist.qwizai.com';
    const successUrl = new URL(`${origin}/payment-success`);
    successUrl.searchParams.append('session_id', '{CHECKOUT_SESSION_ID}');
    successUrl.searchParams.append('plan', planId);
    successUrl.searchParams.append('is_annual', isAnnual.toString());

    console.log(`Success URL: ${successUrl.toString()}`);
    console.log(`Creating checkout session with price ID: ${planId}`);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: planId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl.toString(),
      cancel_url: `${origin}/pricing?canceled=true`,
      metadata: {
        user_id: 'ac3bb49a-1d00-492a-b047-618896441771',
        plan_id: planId,
        is_annual: isAnnual.toString(),
      },
      subscription_data: {
        metadata: {
          user_id: 'ac3bb49a-1d00-492a-b047-618896441771',
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
});
