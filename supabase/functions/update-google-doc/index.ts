
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
      requestBody = JSON.parse(text);
    } catch (parseError) {
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
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!requestBody.analysisId || !uuidRegex.test(requestBody.analysisId)) {
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
      
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const { error: updateError } = await supabaseClient
        .from('resume_analyses')
        .update({ 
          error: requestBody.error,
          status: 'error'
        })
        .eq('id', requestBody.analysisId);
        
      if (updateError) {
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

    if (!requestBody.analysisId) {
      throw new Error('Analysis ID is required');
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(requestBody.analysisId)) {
      throw new Error(`Invalid analysisId format: ${requestBody.analysisId}`);
    }

    const {
      analysisId,
      googleDocUrl,
      jobDescription,
      goldenResume,
      originalResume,
      matchScore,
    } = requestBody;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: analysis, error: analysisError } = await supabaseClient
      .from('resume_analyses')
      .select('job_id, resume_id')
      .eq('id', analysisId)
      .maybeSingle();

    if (analysisError) {
      throw analysisError;
    }

    if (!analysis) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `No analysis record found with ID: ${analysisId}` 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    if (analysis.job_id && jobDescription) {
      const companyName = jobDescription?.company?.name || null;
      const companyUrl = jobDescription?.company?.url || null;
      const jobTitle = jobDescription?.job?.title || null;
      const jobLanguage = jobDescription?.job?.language || null;
      
      const { error: jobUpdateError } = await supabaseClient
        .from('jobs')
        .update({
          company_name: companyName,
          company_url: companyUrl,
          job_title: jobTitle,
          language: jobLanguage,
          job_description: jobDescription,
        })
        .eq('id', analysis.job_id);

      if (jobUpdateError) {
        throw jobUpdateError;
      }
    }

    if (analysis.resume_id && originalResume) {
      const { error: resumeUpdateError } = await supabaseClient
        .from('resumes')
        .update({
          formatted_resume: originalResume
        })
        .eq('id', analysis.resume_id);

      if (resumeUpdateError) {
        throw resumeUpdateError;
      }
    }

    const updateData: any = {
      google_doc_url: googleDocUrl,
      status: 'success',
    };
    
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

    if (goldenResume && analysis.resume_id) {
      const { data: editorData, error: editorCheckError } = await supabaseClient
        .from('resume_editors')
        .select('id')
        .eq('analysis_id', analysisId)
        .maybeSingle();

      if (editorCheckError && editorCheckError.code !== 'PGRST116') {
        throw editorCheckError;
      }

      const resumeData = {
        resume: {
          ...goldenResume,
          professionalExperience: goldenResume.professionalExperience?.map((exp: any) => ({
            ...exp,
            companyIntroduction: exp.companyIntroduction || ''
          })) || []
        }
      };

      if (editorData) {
        const { error: editorUpdateError } = await supabaseClient
          .from('resume_editors')
          .update({
            content: resumeData,
            last_saved: new Date().toISOString()
          })
          .eq('id', editorData.id);

        if (editorUpdateError) {
          throw editorUpdateError;
        }
      } else {
        const { error: editorInsertError } = await supabaseClient
          .from('resume_editors')
          .insert({
            analysis_id: analysisId,
            content: resumeData,
            last_saved: new Date().toISOString()
          });

        if (editorInsertError) {
          throw editorInsertError;
        }
      }
    }

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
