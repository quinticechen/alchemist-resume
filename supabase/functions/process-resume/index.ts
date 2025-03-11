
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
    const { resumeId, jobUrl } = await req.json()
    console.log('Received request:', { resumeId, jobUrl })

    if (!resumeId || !jobUrl) {
      throw new Error('Both resumeId and jobUrl are required')
    }

    // Validate resumeId is a proper UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(resumeId)) {
      throw new Error(`Invalid resumeId format: ${resumeId}`);
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get resume details
    const { data: resume, error: resumeError } = await supabaseClient
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single()

    if (resumeError) {
      throw resumeError
    }

    // Create or find job record
    const { data: jobData, error: jobError } = await supabaseClient
      .from('jobs')
      .insert({
        user_id: resume.user_id,
      })
      .select()
      .single()

    if (jobError) {
      throw jobError
    }

    // Get the public URL for the resume
    const { data: publicUrlData } = supabaseClient.storage
      .from('resumes')
      .getPublicUrl(resume.file_path)

    // Create initial analysis record
    const { data: analysis, error: analysisError } = await supabaseClient
      .from('resume_analyses')
      .insert({
        resume_id: resumeId,
        job_url: jobUrl,
        user_id: resume.user_id,
        job_id: jobData.id,
        status: 'pending'
      })
      .select()
      .single()

    if (analysisError) {
      throw analysisError
    }

    // Send data to Make webhook
    const makeWebhookUrl = Deno.env.get('MAKE_WEBHOOK_URL')
    if (!makeWebhookUrl) {
      throw new Error('Make webhook URL not configured')
    }

    const makeResponse = await fetch(makeWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        analysisId: analysis.id,
        resumeUrl: publicUrlData.publicUrl,
        jobUrl: jobUrl,
        fileName: resume.file_name,
      }),
    })

    if (!makeResponse.ok) {
      throw new Error('Failed to send data to Make webhook')
    }

    console.log('Successfully sent data to Make webhook:', {
      analysisId: analysis.id,
      resumeUrl: publicUrlData.publicUrl,
      jobUrl: jobUrl,
    })

    return new Response(
      JSON.stringify({ 
        message: 'Processing started',
        analysisId: analysis.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error processing resume:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
