import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { jobId } = await req.json()
    
    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get job details from the database
    const { data: jobData, error: jobError } = await supabaseClient
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError) {
      console.error('Error fetching job:', jobError)
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine which webhook URL to use based on environment
    const isProduction = Deno.env.get('ENVIRONMENT') === 'production'
    const webhookUrl = isProduction 
      ? 'https://n8n.qwizai.com/webhook/bb306a40-e545-48f7-9c17-f6c01d6b222b'
      : 'https://n8n.qwizai.com/webhook-test/bb306a40-e545-48f7-9c17-f6c01d6b222b'

    // Send job data to n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobId: jobId,
        jobData: jobData,
        callbackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/company-research-webhook`
      })
    })

    if (!response.ok) {
      throw new Error(`N8N webhook failed: ${response.status}`)
    }

    console.log('Successfully triggered company research for job:', jobId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Company research triggered successfully',
        jobId: jobId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error triggering company research:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to trigger company research' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})