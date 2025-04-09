
// Resume AI Assistant Edge Function
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.24.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY") || "",
});

// Define assistant ID
const RESUME_ASSISTANT_ID = "asst_ahHD2JpnG0XCsHVBbCSUmRVr";

// Initialize Supabase admin client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { message, analysisId, currentSection, threadId } = await req.json();
    
    console.log(`Request received for analysis ID: ${analysisId}, section: ${currentSection || 'none'}, threadId: ${threadId || 'none'}`);
    
    // Validate required parameters
    if (!message) {
      throw new Error("Missing required parameter: message");
    }
    
    if (!analysisId) {
      throw new Error("Missing required parameter: analysisId");
    }

    // Get resume and job data
    const { data: analysisData } = await supabaseAdmin
      .from("resume_analyses")
      .select(`
        id,
        job:job_id (
          job_title,
          company_name,
          job_description
        ),
        resume:resume_id (
          formatted_resume
        )
      `)
      .eq("id", analysisId)
      .single();

    // Variables for content
    let resumeContent = "";
    let jobContext = "";
    
    // Get or create thread
    let thread;
    let existingThread = false;
    
    // Try to use existing thread ID if provided
    if (threadId) {
      try {
        thread = await openai.beta.threads.retrieve(threadId);
        existingThread = true;
        console.log(`Using existing thread: ${threadId}`);
      } catch (error) {
        console.log(`Could not retrieve thread ${threadId}, creating new one`);
        thread = await openai.beta.threads.create();
      }
    } else {
      // Check for existing thread in metadata
      try {
        const { data: metadataData } = await supabaseAdmin
          .from("ai_chat_metadata")
          .select("thread_id")
          .eq("analysis_id", analysisId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (metadataData && metadataData.length > 0) {
          try {
            const existingThreadId = metadataData[0].thread_id;
            thread = await openai.beta.threads.retrieve(existingThreadId);
            existingThread = true;
            console.log(`Retrieved existing thread: ${existingThreadId}`);
          } catch (error) {
            console.log(`Could not retrieve stored thread, creating new one`);
            thread = await openai.beta.threads.create();
          }
        } else {
          thread = await openai.beta.threads.create();
          console.log(`Created new thread: ${thread.id}`);
        }
      } catch (error) {
        console.log("Error fetching metadata, creating new thread");
        thread = await openai.beta.threads.create();
      }
    }
    
    // Extract section content and job details if available
    if (analysisData) {
      console.log(`Found analysis data for ID: ${analysisId}`);
      
      // Get job context if available
      if (analysisData.job) {
        const jobTitle = analysisData.job.job_title || "Unknown position";
        const companyName = analysisData.job.company_name || "Unknown company";
        
        if (analysisData.job.job_description) {
          jobContext = `The user is applying for "${jobTitle}" at "${companyName}". The job description is: ${JSON.stringify(analysisData.job.job_description)}`;
        }
      }
      
      // Get section content if available
      if (currentSection && analysisData.resume?.formatted_resume) {
        const resumeData = analysisData.resume.formatted_resume;
        
        if (currentSection === "skills" && resumeData.skills) {
          resumeContent = JSON.stringify(resumeData.skills);
        } else if (currentSection === "professionalExperience" && resumeData.experience) {
          resumeContent = JSON.stringify(resumeData.experience);
        } else if (currentSection === "education" && resumeData.education) {
          resumeContent = JSON.stringify(resumeData.education);
        } else if (currentSection === "projects" && resumeData.projects) {
          resumeContent = JSON.stringify(resumeData.projects);
        } else if (currentSection === "personalInfo" && resumeData.personalInfo) {
          resumeContent = JSON.stringify(resumeData.personalInfo);
        } else if (currentSection === "professionalSummary" && resumeData.professionalSummary) {
          resumeContent = JSON.stringify(resumeData.professionalSummary);
        } else if (currentSection === "certifications" && resumeData.certifications) {
          resumeContent = JSON.stringify(resumeData.certifications);
        } else if (currentSection === "volunteer" && resumeData.volunteer) {
          resumeContent = JSON.stringify(resumeData.volunteer);
        }
      }
    } else {
      // If analysis data not found, try to get editor content
      console.log(`Analysis data not found, checking editor content`);
      
      try {
        const { data: editorData } = await supabaseAdmin
          .from('resume_editors')
          .select('content')
          .eq('analysis_id', analysisId)
          .single();
          
        if (editorData?.content?.resume) {
          console.log(`Found editor content for analysis: ${analysisId}`);
          
          const resumeData = editorData.content.resume;
          
          if (currentSection === "skills" && resumeData.skills) {
            resumeContent = JSON.stringify(resumeData.skills);
          } else if (currentSection === "professionalExperience" && resumeData.professionalExperience) {
            resumeContent = JSON.stringify(resumeData.professionalExperience);
          } else if (currentSection === "education" && resumeData.education) {
            resumeContent = JSON.stringify(resumeData.education);
          } else if (currentSection === "projects" && resumeData.projects) {
            resumeContent = JSON.stringify(resumeData.projects);
          } else if (currentSection === "personalInfo" && resumeData.personalInfo) {
            resumeContent = JSON.stringify(resumeData.personalInfo);
          } else if (currentSection === "professionalSummary" && resumeData.professionalSummary) {
            resumeContent = JSON.stringify(resumeData.professionalSummary);
          } else if (currentSection === "certifications" && resumeData.certifications) {
            resumeContent = JSON.stringify(resumeData.certifications);
          } else if (currentSection === "volunteer" && resumeData.volunteer) {
            resumeContent = JSON.stringify(resumeData.volunteer);
          }
        }
      } catch (error) {
        console.log("Error fetching editor data, continuing with empty resumeContent");
      }
    }

    // Create system prompt
    const systemPrompt = `You are a professional resume writing assistant. Help the user improve their resume.
Your primary goal is to help them make their resume more impactful, professional, and tailored to their target job.

${jobContext ? `\nJob Context:\n${jobContext}` : ""}
${resumeContent ? `\nCurrent section content:\n${resumeContent}` : ""}

If asked to optimize or improve a section, provide specific, actionable suggestions.
When appropriate, provide a revised version of the text that the user can directly apply to their resume.
Always be respectful, professional, and encouraging.`;

    console.log(`Created system prompt for analysis: ${analysisId}`);
    
    // Add user message to thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });
    
    console.log(`Added user message to thread: ${thread.id}`);

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: RESUME_ASSISTANT_ID,
      instructions: systemPrompt,
    });
    
    console.log(`Started assistant run: ${run.id}`);

    // Wait for completion
    let runStatus = null;
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
      const runStatusResponse = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      runStatus = runStatusResponse.status;
      
      console.log(`Run status check ${attempts + 1}/${maxAttempts}: ${runStatus}`);
      
      if (runStatus === "completed") break;
      if (runStatus === "failed" || runStatus === "cancelled" || runStatus === "expired") {
        throw new Error(`Run failed with status: ${runStatus}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    if (runStatus !== "completed") {
      throw new Error(`Assistant run did not complete within the time limit`);
    }

    // Get assistant response
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    const lastAssistantMessage = messages.data
      .filter((message) => message.role === "assistant")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (!lastAssistantMessage) {
      throw new Error("No assistant response found");
    }

    // Extract message content and suggestion
    let responseText = "";
    let suggestion = null;

    if (lastAssistantMessage.content[0].type === "text") {
      responseText = lastAssistantMessage.content[0].text.value;

      // Check for suggestion
      const suggestionMatch = responseText.match(/```([\s\S]*?)```/);
      if (suggestionMatch && suggestionMatch[1]) {
        suggestion = suggestionMatch[1].trim();
      }
    }
    
    console.log(`Retrieved assistant response for run: ${run.id}`);

    // Save thread metadata
    try {
      await supabaseAdmin
        .from("ai_chat_metadata")
        .upsert({
          analysis_id: analysisId,
          thread_id: thread.id,
          assistant_id: RESUME_ASSISTANT_ID,
          run_id: run.id,
          section: currentSection,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'analysis_id,thread_id'
        });
        
      console.log(`Stored thread metadata in database`);
      
      // Store system message
      const systemMessageId = crypto.randomUUID();
      await supabaseAdmin
        .from("ai_chat_messages")
        .insert({
          id: systemMessageId,
          role: "system",
          content: systemPrompt,
          timestamp: new Date().toISOString(),
          analysis_id: analysisId,
          section: currentSection,
          thread_id: thread.id
        });
        
      console.log(`Stored system prompt in database with ID: ${systemMessageId}`);
    } catch (error) {
      console.log("Error storing metadata, continuing");
    }

    // Return response
    return new Response(
      JSON.stringify({
        message: responseText,
        suggestion,
        threadId: thread.id,
        assistantId: RESUME_ASSISTANT_ID,
        runId: run.id,
        systemPrompt: systemPrompt
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(`Error in resume-ai-assistant: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        error: `Resume AI Assistant Error: ${error.message}`,
        message: "I'm experiencing technical difficulties. Please try again later.",
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
});
