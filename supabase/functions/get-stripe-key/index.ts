
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // Extract environment from request headers
    const origin = req.headers.get('origin') || '';
    const xEnvironment = req.headers.get('x-environment');
    
    // Determine environment based on headers
    let environment = 'staging';
    
    // First check if x-environment header was sent (highest priority)
    if (xEnvironment) {
      environment = xEnvironment;
    }
    // If not, fallback to origin detection
    else if (origin.includes('resumealchemist.com') || origin.includes('resumealchemist.qwizai.com')) {
      environment = 'production';
    } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      environment = 'development';
    } else if (origin.includes('staging.resumealchemist')) {
      environment = 'staging';
    } else if (origin.includes('vercel.app')) {
      // Check if it's a preview deployment
      if (origin.includes('-git-') || origin.includes('-pr-')) {
        environment = 'preview';
      }
    }
    
    // Get appropriate publishable key based on environment
    const stripePublishableKey = environment === 'production' 
      ? Deno.env.get('STRIPE_PUBLISHABLE_KEY_PRODUCTION')
      : Deno.env.get('STRIPE_PUBLISHABLE_KEY');
    
    if (!stripePublishableKey) {
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
    
    // Return the publishable key
    return new Response(
      JSON.stringify({ key: stripePublishableKey, environment }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
