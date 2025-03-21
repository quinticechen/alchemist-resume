
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
      console.log(`Using environment from x-environment header: ${xEnvironment}`);
      environment = xEnvironment;
    }
    // If not, fallback to origin detection
    else if (origin.includes('resumealchemist.com') || origin.includes('resumealchemist.qwizai.com')) {
      console.log('Detected production environment from origin');
      environment = 'production';
    } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      console.log('Detected development environment from origin');
      environment = 'development';
    } else if (origin.includes('staging.resumealchemist')) {
      console.log('Detected staging environment from origin');
      environment = 'staging';
    } else if (origin.includes('vercel.app')) {
      // Check if it's a preview deployment
      if (origin.includes('-git-') || origin.includes('-pr-')) {
        console.log('Detected preview environment from origin');
        environment = 'preview';
      }
    }
    
    // Log the detection process
    console.log(`Environment detected: ${environment}`);
    console.log(`Origin: ${origin}`);
    console.log(`x-environment header: ${xEnvironment || 'not set'}`);
    
    // Get appropriate publishable key based on environment
    const keyName = environment === 'production' 
      ? 'STRIPE_PUBLISHABLE_KEY_PRODUCTION'
      : 'STRIPE_PUBLISHABLE_KEY';
      
    const stripePublishableKey = Deno.env.get(keyName);
    
    console.log(`Using Stripe key from: ${keyName}`);
    
    if (!stripePublishableKey) {
      console.error(`Stripe publishable key not found: ${keyName}`);
      return new Response(
        JSON.stringify({ 
          error: `Stripe publishable key is not configured on the server (${keyName})` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`Successfully retrieved Stripe key for environment: ${environment}`);
    
    // Return the publishable key
    return new Response(
      JSON.stringify({ key: stripePublishableKey, environment }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in get-stripe-key function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
