import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.18.0?target=deno";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name, x-environment',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    // 1. 獲取 Stripe 結帳會話資訊
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const customerId = session.customer;

    // 2. 獲取使用者 ID
    const customer = await stripe.customers.retrieve(customerId);
    const userId = customer.metadata.supabase_uid;

    if (!userId) {
      console.error('No user ID found in customer metadata');
      return new Response(JSON.stringify({ error: 'No user ID found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 3. 插入交易記錄
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        stripe_session_id: session.id,
        stripe_subscription_id: session.subscription,
        amount: session.amount_total / 100, // Stripe amounts are in cents
        currency: session.currency,
        status: session.payment_status,
        subscription_tier: session.subscription
          ? (await stripe.subscriptions.retrieve(session.subscription)).items.data[0].price.id
          : null,
      });

    if (transactionError) {
      console.error('Error inserting transaction record:', transactionError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error verifying Stripe session:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});