
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the stripe key from environment variables
    const STRIPE_KEY = Deno.env.get("STRIPE_PUBLIC_KEY");
    
    if (!STRIPE_KEY) {
      console.error("STRIPE_PUBLIC_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ error: "Stripe key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Return the stripe key
    return new Response(
      JSON.stringify({ key: STRIPE_KEY }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in get-stripe-key function:", error.message);
    
    return new Response(
      JSON.stringify({ error: "Failed to get Stripe key" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
