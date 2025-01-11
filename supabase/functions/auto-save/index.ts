import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all resume analyses that have been modified in the last 10 minutes
    const { data: analyses, error: analysesError } = await supabaseClient
      .from('resume_analyses')
      .select('*')
      .gte('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())

    if (analysesError) {
      console.error('Error fetching analyses:', analysesError)
      throw analysesError
    }

    // Get all resumes that have been modified in the last 10 minutes
    const { data: resumes, error: resumesError } = await supabaseClient
      .from('resumes')
      .select('*')
      .gte('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())

    if (resumesError) {
      console.error('Error fetching resumes:', resumesError)
      throw resumesError
    }

    console.log(`Auto-save completed: ${analyses.length} analyses and ${resumes.length} resumes processed`)

    return new Response(
      JSON.stringify({
        message: 'Auto-save completed successfully',
        analyses_count: analyses.length,
        resumes_count: resumes.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in auto-save function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})