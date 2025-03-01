
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.18.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name, x-environment',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Early validation of required environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!stripeSecretKey || !supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing required environment variables');
    }

    // Validate authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Initialize Supabase client with the JWT from the request
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Verify the user's session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Parse and validate request body
    const { planId, isAnnual } = await req.json();
    
    if (!planId || !PLANS[planId]) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan selected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_uid: user.id,
        },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      client_reference_id: customerId,
      line_items: [
        {
          price: PLANS[planId][isAnnual ? 'annual' : 'monthly'],
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
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

//－－－
// // 
// import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// import Stripe from "https://esm.sh/stripe@12.6.0?target=deno";

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-environment',

// };

// serve(async (req) => {
//   // Handle CORS preflight requests
//   if (req.method === 'OPTIONS') {
//     return new Response(null, { headers: corsHeaders });
//   }

//   try {
//     // Get Stripe secret key from environment
//     const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
//     if (!stripeSecretKey) {
//       console.error('STRIPE_SECRET_KEY is not set in environment variables');
//       return new Response(
//         JSON.stringify({ error: 'Server configuration error' }),
//         { 
//           status: 500, 
//           headers: { ...corsHeaders, 'Content-Type': 'application/json' }
//         }
//       );
//     }

//     // Initialize Stripe
//     const stripe = new Stripe(stripeSecretKey, {
//       apiVersion: '2023-10-16',
//     });

//     // Parse request body
//     const { planId, isAnnual } = await req.json();

//     // Get JWT token from authorization header
//     const authHeader = req.headers.get('Authorization');
//     if (!authHeader) {
//       return new Response(
//         JSON.stringify({ error: 'Authorization header is required' }),
//         { 
//           status: 401, 
//           headers: { ...corsHeaders, 'Content-Type': 'application/json' }
//         }
//       );
//     }

//     // Create Supabase client
//     const supabaseUrl = Deno.env.get('SUPABASE_URL');
//     const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
//     if (!supabaseUrl || !supabaseServiceKey) {
//       return new Response(
//         JSON.stringify({ error: 'Supabase configuration error' }),
//         { 
//           status: 500, 
//           headers: { ...corsHeaders, 'Content-Type': 'application/json' }
//         }
//       );
//     }

//     const supabase = createClient(supabaseUrl, supabaseServiceKey);

//     // Validate JWT token and get user
//     const token = authHeader.replace('Bearer ', '');
//     const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
//     if (authError || !user) {
//       console.error('Authentication error:', authError);
//       return new Response(
//         JSON.stringify({ error: 'Invalid or expired token' }),
//         { 
//           status: 401, 
//           headers: { ...corsHeaders, 'Content-Type': 'application/json' }
//         }
//       );
//     }

//     // Set up product and price IDs based on plan and billing frequency
//     let priceId;
//     let successUrl = `${req.headers.get('origin') || 'https://resumealchemist.qwizai.com'}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
//     let cancelUrl = `${req.headers.get('origin') || 'https://resumealchemist.qwizai.com'}/pricing`;

//     // Determine price ID based on plan and billing frequency
//     if (planId === 'alchemist') {
//       priceId = isAnnual ? 'price_alchemist_annual' : 'price_alchemist_monthly';
//     } else if (planId === 'grandmaster') {
//       priceId = isAnnual ? 'price_grandmaster_annual' : 'price_grandmaster_monthly';
//     } else {
//       return new Response(
//         JSON.stringify({ error: 'Invalid plan selected' }),
//         { 
//           status: 400, 
//           headers: { ...corsHeaders, 'Content-Type': 'application/json' }
//         }
//       );
//     }

//     // Create Stripe Checkout Session
//     const session = await stripe.checkout.sessions.create({
//       customer_email: user.email,
//       client_reference_id: user.id,
//       metadata: {
//         user_id: user.id,
//         planId: planId,
//         isAnnual: isAnnual ? 'true' : 'false'
//       },
//       line_items: [
//         {
//           price: priceId,
//           quantity: 1,
//         },
//       ],
//       mode: 'subscription',
//       success_url: successUrl,
//       cancel_url: cancelUrl,
//     });

//     // Return session URL
//     return new Response(
//       JSON.stringify({ sessionUrl: session.url }),
//       { 
//         status: 200, 
//         headers: { ...corsHeaders, 'Content-Type': 'application/json' }
//       }
//     );
//   } catch (error) {
//     console.error('Error in stripe-payment function:', error);
//     return new Response(
//       JSON.stringify({ error: error.message || 'Internal server error' }),
//       { 
//         status: 500, 
//         headers: { ...corsHeaders, 'Content-Type': 'application/json' }
//       }
//     );
//   }
// });
