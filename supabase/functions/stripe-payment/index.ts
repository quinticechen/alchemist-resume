import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.18.0?target=deno";

// Define CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-environment",
};

console.log("Hello from stripe-payment Edge Function!");

// Get environment variables
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!stripeSecretKey) {
  console.error("STRIPE_SECRET_KEY is not set in environment variables");
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set in environment variables"
  );
}

// Import Stripe
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  console.log(`Received ${req.method} request to stripe-payment function`);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Check if it's a POST request
    if (req.method !== "POST") {
      console.error(`Invalid method: ${req.method}`);
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get JWT token from authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
      console.log(`Request data:`, JSON.stringify(requestData));
    } catch (err) {
      console.error("Error parsing request body:", err);
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { planId, priceId, isAnnual } = requestData;

    if (!planId || !priceId) {
      console.error("Missing planId or priceId in request");
      return new Response(
        JSON.stringify({ error: "Missing plan or price information" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate planId
    if (!["alchemist", "grandmaster"].includes(planId)) {
      console.error(`Invalid planId: ${planId}`);
      return new Response(JSON.stringify({ error: "Invalid plan ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract user ID from JWT token
    const token = authHeader.replace("Bearer ", "");
    console.log(`Authenticating user with token: ${token.substring(0, 15)}...`);

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!userResponse.ok) {
      console.error(
        `Failed to authenticate user: ${userResponse.status} ${userResponse.statusText}`
      );
      const userRespBody = await userResponse.text();
      console.error(`Response body: ${userRespBody}`);
      return new Response(
        JSON.stringify({ error: "Failed to authenticate user" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userData = await userResponse.json();
    if (!userData.id) {
      console.error("User not found in response", userData);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.id;
    console.log(`Authenticated user ID: ${userId}`);

    // Get user profile information
    const profileResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=email,stripe_customer_id`,
      {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
          "Content-Type": "application/json",
        },
      }
    );

    const profiles = await profileResponse.json();
    if (!profileResponse.ok || profiles.length === 0) {
      console.error("User profile not found", profiles);
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profile = profiles[0];
    const userEmail = userData.email || profile.email;
    let stripeCustomerId = profile.stripe_customer_id;

    console.log(
      `Processing payment for user: ${userId}, email: ${userEmail}, plan: ${planId} (${
        isAnnual ? "annual" : "monthly"
      })`
    );

    // Create Stripe customer if not exists
    if (!stripeCustomerId) {
      console.log("Creating new Stripe customer");
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          user_id: userId,
        },
      });
      stripeCustomerId = customer.id;

      // Update profile with Stripe customer ID
      await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ stripe_customer_id: stripeCustomerId }),
      });

      console.log(`Created new Stripe customer with ID: ${stripeCustomerId}`);
    } else {
      console.log(`Using existing Stripe customer ID: ${stripeCustomerId}`);

      // Update customer metadata
      await stripe.customers.update(stripeCustomerId, {
        metadata: {
          user_id: userId,
        },
      });
    }

    // Set up product details
    let productName, productDescription;
    if (planId === "alchemist") {
      productName = "Alchemist Plan";
      productDescription = isAnnual
        ? "Annual Alchemist Subscription"
        : "Monthly Alchemist Subscription";
    } else {
      productName = "Grandmaster Plan";
      productDescription = isAnnual
        ? "Annual Grandmaster Subscription"
        : "Monthly Grandmaster Subscription";
    }

    // Calculate success URL
    const origin =
      req.headers.get("origin") || "https://resumealchemist.qwizai.com";
    const successUrl = new URL(`${origin}/payment-success`);
    successUrl.searchParams.append("session_id", "{CHECKOUT_SESSION_ID}");
    successUrl.searchParams.append("plan", planId);
    successUrl.searchParams.append("is_annual", isAnnual.toString());

    console.log(`Success URL: ${successUrl.toString()}`);
    console.log(`Creating checkout session with price ID: ${priceId}`);

    try {
      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: successUrl.toString(),
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (stripeError: any) {
      console.error("Stripe error creating checkout session:", stripeError);
      return new Response(
        JSON.stringify({
          error: stripeError.message || "Error creating checkout session",
          code: stripeError.code || "unknown",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("Error in stripe-payment edge function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
