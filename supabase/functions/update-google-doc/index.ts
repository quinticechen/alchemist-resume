import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { analysisId, googleDocUrl } = await req.json()
    console.log('Received update request:', { analysisId, googleDocUrl })

    if (!analysisId || !googleDocUrl) {
      throw new Error('Missing required fields: analysisId or googleDocUrl')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update the resume analysis with the Google Doc URL
    const { data, error } = await supabaseClient
      .from('resume_analyses')
      .update({ google_doc_url: googleDocUrl })
      .eq('id', analysisId)
      .select()
      .single()

    if (error) {
      throw error
    }

    console.log('Successfully updated analysis with Google Doc URL:', data)

    return new Response(
      JSON.stringify({ 
        message: 'Successfully updated analysis with Google Doc URL',
        data 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error updating Google Doc URL:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})