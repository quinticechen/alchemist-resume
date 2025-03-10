
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
    // Parse the request body with better error handling
    let requestBody;
    try {
      const text = await req.text();
      console.log("Raw request body:", text);
      
      // Fix any potential JSON syntax issues
      // This is a temporary fix to handle missing commas in the JSON
      const fixedText = text.replace(/}(\s*)"([^"]+)"/g, '},$1"$2"')
                             .replace(/\n/g, '')
                             .replace(/([^,{])\s*"([^"]+)":/g, '$1,"$2":');
      
      console.log("Fixed request body:", fixedText);
      requestBody = JSON.parse(fixedText);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError.message);
      return new Response(
        JSON.stringify({ error: `Invalid JSON: ${parseError.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
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
      matchScore
    } = requestBody;

    console.log('Received data:', {
      analysisId,
      googleDocUrl,
      companyName,
      jobTitle,
      jobLanguage,
      matchScore
    });

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
      console.error('Error fetching analysis:', analysisError);
      throw analysisError;
    }

    // Update the jobs table with job information
    if (analysis.job_id) {
      const { error: jobUpdateError } = await supabaseClient
        .from('jobs')
        .update({
          company_name: companyName,
          company_url: companyUrl,
          job_title: jobTitle,
          language: jobLanguage,
          job_description: typeof jobDescription === 'string' 
            ? (jobDescription.startsWith('{') ? JSON.parse(jobDescription) : jobDescription) 
            : jobDescription
        })
        .eq('id', analysis.job_id);

      if (jobUpdateError) {
        console.error('Error updating job:', jobUpdateError);
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
        console.error('Error updating resume:', resumeUpdateError);
        throw resumeUpdateError;
      }
    }

    // Update the analysis with Google Doc URL, golden resume, and match score
    const { error: analysisUpdateError } = await supabaseClient
      .from('resume_analyses')
      .update({
        google_doc_url: googleDocUrl,
        golden_resume: goldenResume,
        match_score: matchScore ? parseFloat(matchScore) : null
      })
      .eq('id', analysisId);

    if (analysisUpdateError) {
      console.error('Error updating analysis:', analysisUpdateError);
      throw analysisUpdateError;
    }

    console.log('Successfully updated records for analysis ID:', analysisId);

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
    console.error('Error processing update:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
