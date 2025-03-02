
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import Stripe from "https://esm.sh/stripe@13.2.0?target=deno";

console.log("Hello from stripe-payment Edge Function!");

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Check if it's not a POST request
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the JWT token from the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the request body
    const { planId, priceId, isAnnual } = await req.json();
    if (!planId || !priceId) {
      return new Response(JSON.stringify({ error: 'Missing plan or price information' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate that planId is one of the allowed values
    if (!['alchemist', 'grandmaster'].includes(planId)) {
      return new Response(JSON.stringify({ error: 'Invalid plan ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract the user ID from the JWT token
    const token = authHeader.replace('Bearer ', '');
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      return new Response(JSON.stringify({ error: 'Failed to authenticate user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user } } = await userResponse.json();
    if (!user || !user.id) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    console.log('Authenticated user ID:', userId);

    // Get the user's email and customer ID if available
    let stripeCustomerId;
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=email,stripe_customer_id`, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
    });

    const profiles = await profileResponse.json();
    if (!profileResponse.ok || profiles.length === 0) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const profile = profiles[0];
    const userEmail = profile.email;
    stripeCustomerId = profile.stripe_customer_id;

    console.log(`Processing payment for user: ${userId}, email: ${userEmail}, plan: ${planId} (${isAnnual ? 'annual' : 'monthly'})`);

    // If the user doesn't have a Stripe customer ID, create one
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          user_id: userId
        }
      });
      stripeCustomerId = customer.id;

      // Update the user's profile with the Stripe customer ID
      await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ stripe_customer_id: stripeCustomerId }),
      });

      console.log(`Created new Stripe customer with ID: ${stripeCustomerId}`);
    } else {
      console.log(`Using existing Stripe customer ID: ${stripeCustomerId}`);
      
      // Make sure the customer has the user_id in metadata
      await stripe.customers.update(stripeCustomerId, {
        metadata: {
          user_id: userId
        }
      });
    }

    // Set up the product details based on the plan
    let productName, productDescription;
    if (planId === 'alchemist') {
      productName = 'Alchemist Plan';
      productDescription = isAnnual ? 'Annual Alchemist Subscription' : 'Monthly Alchemist Subscription';
    } else {
      productName = 'Grandmaster Plan';
      productDescription = isAnnual ? 'Annual Grandmaster Subscription' : 'Monthly Grandmaster Subscription';
    }

    // Calculate the success URL with all the necessary parameters
    const successUrl = new URL(`${req.headers.get('origin') || 'https://resumealchemist.qwizai.com'}/payment-success`);
    successUrl.searchParams.append('session_id', '{CHECKOUT_SESSION_ID}');
    successUrl.searchParams.append('plan', planId);
    successUrl.searchParams.append('is_annual', isAnnual.toString());

    // Create the Stripe Checkout Session
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
      success_url: successUrl.toString(),
      cancel_url: `${req.headers.get('origin') || 'https://resumealchemist.qwizai.com'}/pricing?canceled=true`,
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
  } catch (error) {
    console.error('Error in stripe-payment edge function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
