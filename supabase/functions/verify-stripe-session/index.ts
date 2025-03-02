
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import Stripe from "https://esm.sh/stripe@13.2.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

console.log("Hello from verify-stripe-session Edge Function!");

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  httpClient: Stripe.createFetchHttpClient(),
});

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS for preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Only handle POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the session ID from the request body
    const { sessionId } = await req.json();
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Missing session ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Verifying Stripe checkout session: ${sessionId}`);

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Invalid session ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if the session was paid
    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ success: false, error: 'Payment not completed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get additional information from the session
    const planId = session.metadata?.plan_id || 'unknown';
    const isAnnual = session.metadata?.is_annual === 'true';
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    console.log(`Session verified: plan=${planId}, isAnnual=${isAnnual}, customer=${customerId}, subscription=${subscriptionId}`);

    // Retrieve the user ID from the customer metadata or from our database
    let userId;
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer && !customer.deleted && customer.metadata && customer.metadata.user_id) {
        userId = customer.metadata.user_id;
      } else {
        // Look up the user from our database
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
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
      console.error('Error getting user ID:', error);
      return new Response(JSON.stringify({ success: false, error: 'Could not verify user' }), {
        status: 200,
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
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`Error verifying Stripe session: ${error.message}`);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
