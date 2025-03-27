
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
    // Parse the request body without any "fixing" attempts
    let requestBody;
    try {
      const text = await req.text();
      // console.log("Raw request body:", text);
      
      // Parse the JSON directly without modifications
      requestBody = JSON.parse(text);
    } catch (parseError) {
      // console.error("JSON parsing error:", parseError.message);
      return new Response(
        JSON.stringify({ error: `Invalid JSON: ${parseError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Early return if there's an error in the request
    if (requestBody.error) {
      // console.log("Error received in request:", requestBody.error);
      
      // Check if analysisId looks like a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!requestBody.analysisId || !uuidRegex.test(requestBody.analysisId)) {
        // console.error("Invalid analysisId format:", requestBody.analysisId);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Error: Invalid analysisId format. Expected UUID, received: ' + requestBody.analysisId 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
      
      // Initialize Supabase client
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      // Update the resume analysis with the error message
      const { error: updateError } = await supabaseClient
        .from('resume_analyses')
        .update({ 
          error: requestBody.error,
          status: 'error' // Using the new enumerated type value
        })
        .eq('id', requestBody.analysisId);
        
      if (updateError) {
        // console.error("Error updating analysis with error message:", updateError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Failed to update analysis with error: ${updateError.message}` 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      } else {
        // console.log("Successfully updated analysis with error status for ID:", requestBody.analysisId);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Error logged successfully' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Validate required fields
    if (!requestBody.analysisId) {
      throw new Error('Analysis ID is required');
    }
    
    // Validate analysisId is a proper UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(requestBody.analysisId)) {
      throw new Error(`Invalid analysisId format: ${requestBody.analysisId}`);
    }

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
      jobUrl,
      formattedGoldenResume,
      formattedOriginalResume
    } = requestBody;

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First, get the analysis to find the job_id and resume_id
    const { data: analysis, error: analysisError } = await supabaseClient
      .from('resume_analyses')
      .select('job_id, resume_id')
      .eq('id', analysisId)
      .single();

    if (analysisError) {
      throw analysisError;
    }

    // Update the jobs table with job information including job_url
    if (analysis.job_id) {
      // Process job description - could be string or object
      let jobDescriptionData;
      
      if (typeof jobDescription === 'string') {
        try {
          // Try to parse if it's a JSON string
          jobDescriptionData = JSON.parse(jobDescription);
        } catch {
          // If it's not valid JSON, use as-is
          jobDescriptionData = jobDescription;
        }
      } else {
        // Already an object
        jobDescriptionData = jobDescription;
      }

      const { error: jobUpdateError } = await supabaseClient
        .from('jobs')
        .update({
          company_name: companyName,
          company_url: companyUrl,
          job_title: jobTitle,
          language: jobLanguage,
          job_url: jobUrl,
          job_description: jobDescriptionData
        })
        .eq('id', analysis.job_id);

      if (jobUpdateError) {
        throw jobUpdateError;
      }
    }

    // Update the resume with original resume content
    if (analysis.resume_id && originalResume) {
      const { error: resumeUpdateError } = await supabaseClient
        .from('resumes')
        .update({
          original_resume: originalResume
        })
        .eq('id', analysis.resume_id);

      if (resumeUpdateError) {
        throw resumeUpdateError;
      }
    }

    // Update the analysis with Google Doc URL, golden resume, formatted resumes, and match score
    const updateData: any = {
      google_doc_url: googleDocUrl,
      golden_resume: goldenResume,
      status: 'success' // Using the new enumerated type value
    };
    
    // Add formatted resume data if available
    if (formattedGoldenResume) {
      updateData.formatted_golden_resume = formattedGoldenResume;
    }
    
    if (formattedOriginalResume) {
      updateData.formatted_original_resume = formattedOriginalResume;
    }
    
    if (matchScore) {
      updateData.match_score = parseFloat(matchScore);
    }

    const { error: analysisUpdateError } = await supabaseClient
      .from('resume_analyses')
      .update(updateData)
      .eq('id', analysisId);

    if (analysisUpdateError) {
      throw analysisUpdateError;
    }

    // console.log('Successfully updated records for analysis ID:', analysisId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Records updated successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
