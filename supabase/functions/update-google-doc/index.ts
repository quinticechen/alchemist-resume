
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
    const {
      analysisId,
      googleDocUrl,
      companyName,
      companyUrl,
      jobTitle,
      jobLanguage,
      jobDescription,
      goldenResume,
      originalResume,
      matchScore,
      error
    } = await req.json()

    console.log('Received update request:', {
      analysisId,
      googleDocUrl,
      companyName,
      companyUrl,
      jobTitle,
      jobLanguage,
      hasJobDescription: !!jobDescription,
      hasGoldenResume: !!goldenResume,
      hasOriginalResume: !!originalResume,
      matchScore,
      error
    })

    if (!analysisId) {
      throw new Error('Missing required field: analysisId')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let jobId = null;

    // If we have job details, create a job record
    if (companyName || companyUrl || jobTitle || jobLanguage || jobDescription) {
      const { data: jobData, error: jobError } = await supabaseClient
        .from('jobs')
        .insert({
          company_name: companyName,
          company_url: companyUrl,
          job_title: jobTitle,
          language: jobLanguage,
          job_description: jobDescription ? JSON.parse(jobDescription) : null
        })
        .select('id')
        .single()

      if (jobError) {
        console.error('Error creating job record:', jobError)
      } else {
        jobId = jobData?.id
        console.log('Created job record with ID:', jobId)
      }
    }

    // Update original resume if provided
    if (originalResume) {
      // First, get the resume_id from the analysis
      const { data: analysisData, error: analysisError } = await supabaseClient
        .from('resume_analyses')
        .select('resume_id')
        .eq('id', analysisId)
        .single()

      if (!analysisError && analysisData?.resume_id) {
        const resumeId = analysisData.resume_id
        const { error: resumeError } = await supabaseClient
          .from('resumes')
          .update({ original_resume: originalResume })
          .eq('id', resumeId)

        if (resumeError) {
          console.error('Error updating resume with original content:', resumeError)
        } else {
          console.log('Updated original resume content for resume ID:', resumeId)
        }
      } else {
        console.error('Error fetching resume_id from analysis:', analysisError)
      }
    }

    // Update the resume analysis with the Google Doc URL or error
    const updateData = error 
      ? { error } 
      : {
          google_doc_url: googleDocUrl,
          golden_resume: goldenResume,
          match_score: matchScore ? parseFloat(matchScore) : null,
          job_id: jobId
        }

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
