
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
};

console.log('Edge Function: get-stripe-key initialized');

serve(async (req: Request) => {
  console.log(`Edge Function: Received ${req.method} request`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Edge Function: Handling CORS preflight request');
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    console.log(`Edge Function: Invalid method ${req.method}`);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    console.log('Edge Function: Attempting to retrieve Stripe publishable key');
    const publishableKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY');

    if (!publishableKey) {
      console.error('Edge Function: Stripe publishable key not found in environment');
      throw new Error('Configuration error: Stripe publishable key not found');
    }

    console.log('Edge Function: Successfully retrieved Stripe publishable key');
    
    return new Response(
      JSON.stringify({ publishableKey }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error('Edge Function Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});