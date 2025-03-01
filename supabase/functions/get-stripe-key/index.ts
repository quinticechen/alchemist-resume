
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the Stripe publishable key from environment variables
    const stripeKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY');
    
    if (!stripeKey) {
      console.error('Stripe publishable key is not set in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Stripe key not configured',
          message: 'STRIPE_PUBLISHABLE_KEY environment variable is not set'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return the key
    return new Response(
      JSON.stringify({ key: stripeKey }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in get-stripe-key function:', error.message);
    return new Response(
      JSON.stringify({ 
        error: 'Server error',
        message: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
