
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    // console.log("Handling OPTIONS preflight request");
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // console.log("get-stripe-key function called");
    
    // Extract environment from request headers
    const origin = req.headers.get('origin') || '';
    
    // Determine environment based on origin
    let environment = 'staging';
    if (origin.includes('resumealchemist.com') || origin.includes('resumealchemist.qwizai.com')) {
      environment = 'production';
    } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      environment = 'development';
    } else if (origin.includes('staging.resumealchemist')) {
      environment = 'staging';
    }
    
    // console.log(`Detected environment: ${environment}`);
    
    // Get appropriate publishable key based on environment
    const stripePublishableKey = environment === 'production' 
      ? Deno.env.get('STRIPE_PUBLISHABLE_KEY_PRODUCTION')
      : Deno.env.get('STRIPE_PUBLISHABLE_KEY');
    
    if (!stripePublishableKey) {
      // console.error(`${environment.toUpperCase()}_STRIPE_PUBLISHABLE_KEY is not set in environment variables`);
      return new Response(
        JSON.stringify({ 
          error: 'Stripe publishable key is not configured on the server' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // console.log(`Successfully retrieved Stripe publishable key for ${environment}`);
    
    // Return the publishable key
    return new Response(
      JSON.stringify({ key: stripePublishableKey }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    // console.error('Error in get-stripe-key function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
