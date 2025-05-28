
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.24.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
if (!openaiApiKey) {
  console.error("OPENAI_API_KEY environment variable is not set");
}

const openai = new OpenAI({
  apiKey: openaiApiKey || ""
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

function handleCorsOptions() {
  return new Response(null, { headers: corsHeaders });
}

async function generateCoverLetter(resumeContent: any, jobDescription: any, companyName: string) {
  const prompt = `You are an AI cover letter assistant, help me craft a compelling cover letter for ${companyName} based on your resume and the job description provided. Please consider the following:

Resume Information:
${JSON.stringify(resumeContent)}

Job Description:
${JSON.stringify(jobDescription)}

Instructions:
1. Create a personalized cover letter that demonstrates my qualifications align with the job requirements
2. Highlight relevant skills and experiences from my resume that match the position
3. Show genuine interest in the company and role
4. Maintain a professional yet engaging tone
5. Keep the length to approximately 300-400 words
6. Structure the letter with clear introduction, body paragraphs, and conclusion
7. Include specific examples that demonstrate my value
8. Ensure proper formatting and no grammatical errors
9. Use the same language as Job Description provide to generate a cover letter

Please generate a cover letter that effectively presents my candidacy for this position.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a professional cover letter writer. Generate compelling, personalized cover letters that highlight the candidate's strengths and align with job requirements." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1000
  });

  return completion.choices[0].message.content || "Failed to generate cover letter.";
}

async function handleRequest(req: Request) {
  try {
    console.log("Request received to generate-cover-letter");

    const requestBody = await req.json();
    const { analysisId } = requestBody;

    if (!analysisId) {
      throw new Error("Missing required parameter: analysisId");
    }

    console.log(`Processing cover letter generation for analysis ID: ${analysisId}`);

    if (!openaiApiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    // Fetch analysis data with resume and job information
    const { data: analysisData, error: analysisError } = await supabaseAdmin
      .from("resume_analyses")
      .select(`
        id,
        job:job_id (
          job_title,
          company_name,
          job_description
        )
      `)
      .eq("id", analysisId)
      .single();

    if (analysisError || !analysisData) {
      throw new Error(`Failed to fetch analysis data: ${analysisError?.message}`);
    }

    // Fetch resume content from resume_editors
    const { data: editorData, error: editorError } = await supabaseAdmin
      .from("resume_editors")
      .select("content")
      .eq("analysis_id", analysisId)
      .single();

    if (editorError || !editorData) {
      throw new Error(`Failed to fetch resume content: ${editorError?.message}`);
    }

    const resumeContent = editorData.content;
    const jobData = analysisData.job;
    const companyName = jobData?.company_name || "the company";
    const jobDescription = jobData?.job_description;

    if (!jobDescription) {
      throw new Error("No job description found for this analysis");
    }

    console.log("Generating cover letter with OpenAI...");
    const coverLetter = await generateCoverLetter(resumeContent, jobDescription, companyName);

    // Check if job_apply record exists, if not create one
    const { data: existingJobApply, error: fetchError } = await supabaseAdmin
      .from("job_apply")
      .select("id, status")
      .eq("analysis_id", analysisId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching job_apply record:", fetchError);
    }

    if (existingJobApply) {
      // Update existing record
      const { error: updateError } = await supabaseAdmin
        .from("job_apply")
        .update({
          cover_letter: coverLetter,
          status: "cover_letter"
        })
        .eq("id", existingJobApply.id);

      if (updateError) {
        throw new Error(`Failed to update cover letter: ${updateError.message}`);
      }
    } else {
      // Create new record
      const { error: insertError } = await supabaseAdmin
        .from("job_apply")
        .insert({
          analysis_id: analysisId,
          cover_letter: coverLetter,
          status: "cover_letter"
        });

      if (insertError) {
        throw new Error(`Failed to save cover letter: ${insertError.message}`);
      }
    }

    console.log("Cover letter generated and saved successfully");

    return new Response(
      JSON.stringify({
        success: true,
        coverLetter: coverLetter
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(`Error in generate-cover-letter: ${error.message}`);
    console.error(error.stack || "No stack trace available");

    return new Response(
      JSON.stringify({
        error: `Cover Letter Generation Error: ${error.message}`,
        success: false
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions();
  }

  return handleRequest(req);
});
