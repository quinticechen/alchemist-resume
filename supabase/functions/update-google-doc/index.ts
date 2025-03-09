
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
    const { analysisId, googleDocUrl, error } = await req.json()
    console.log('Received update request:', { analysisId, googleDocUrl, error })

    if (!analysisId) {
      throw new Error('Missing required field: analysisId')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update the resume analysis with the Google Doc URL or error
    const updateData = error 
      ? { error } 
      : { google_doc_url: googleDocUrl }

    const { data, error: updateError } = await supabaseClient
      .from('resume_analyses')
      .update(updateData)
      .eq('id', analysisId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    if (error) {
      console.log('Updated analysis with error message:', error)
      return new Response(
        JSON.stringify({ 
          message: 'Analysis updated with error information',
          error,
          data
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400, // Using 400 for errors to better distinguish them
        }
      )
    } else {
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
    }
  } catch (error) {
    console.error('Error updating Google Doc URL:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
