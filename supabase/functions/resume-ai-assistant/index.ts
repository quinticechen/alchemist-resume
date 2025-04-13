// Resume AI Assistant Edge Function
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.24.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Validate OpenAI API key exists
const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
if (!openaiApiKey) {
  console.error("OPENAI_API_KEY environment variable is not set");
}

// Initialize OpenAI client with v2 header explicitly
const openai = new OpenAI({
  apiKey: openaiApiKey || "",
  defaultHeaders: { "OpenAI-Beta": "assistants=v2" }
});

// Define assistant ID
const RESUME_ASSISTANT_ID = "asst_kSRCmsWHioSMYH5W0G04dLU0";

// Initialize Supabase admin client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Handle CORS preflight requests
 */
function handleCorsOptions() {
  return new Response(null, { headers: corsHeaders });
}

/**
 * Validate request parameters
 */
function validateRequestParams(message: string, analysisId: string) {
  if (!message) {
    throw new Error("Missing required parameter: message");
  }
  
  if (!analysisId) {
    throw new Error("Missing required parameter: analysisId");
  }
}

/**
 * Get or retrieve an OpenAI thread
 */
async function getOrCreateThread(threadId: string | null, analysisId: string) {
  let thread;
  let existingThread = false;
  
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
  
  return { thread, existingThread };
}

/**
 * Fetch resume analysis data
 */
async function fetchAnalysisData(analysisId: string) {
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
    
  return analysisData;
}

/**
 * Fetch editor content if analysis data not found
 */
async function fetchEditorContent(analysisId: string) {
  const { data: editorData } = await supabaseAdmin
    .from('resume_editors')
    .select('content')
    .eq('analysis_id', analysisId)
    .single();
    
  return editorData;
}

/**
 * Extract section content from resume data
 */
function extractSectionContent(resumeData: any, currentSection: string) {
  if (!resumeData) return "";
  
  switch (currentSection) {
    case "skills":
      return resumeData.skills ? JSON.stringify(resumeData.skills) : "";
    case "professionalExperience":
      return resumeData.experience ? JSON.stringify(resumeData.experience) : "";
    case "education":
      return resumeData.education ? JSON.stringify(resumeData.education) : "";
    case "projects":
      return resumeData.projects ? JSON.stringify(resumeData.projects) : "";
    case "personalInfo":
      return resumeData.personalInfo ? JSON.stringify(resumeData.personalInfo) : "";
    case "professionalSummary":
      return resumeData.professionalSummary ? JSON.stringify(resumeData.professionalSummary) : "";
    case "certifications":
      return resumeData.certifications ? JSON.stringify(resumeData.certifications) : "";
    case "volunteer":
      return resumeData.volunteer ? JSON.stringify(resumeData.volunteer) : "";
    default:
      return "";
  }
}

/**
 * Extract section content from editor data
 */
function extractEditorSectionContent(editorData: any, currentSection: string) {
  if (!editorData?.content?.resume) return "";
  
  const resumeData = editorData.content.resume;
  
  switch (currentSection) {
    case "skills":
      return resumeData.skills ? JSON.stringify(resumeData.skills) : "";
    case "professionalExperience":
      return resumeData.professionalExperience ? JSON.stringify(resumeData.professionalExperience) : "";
    case "education":
      return resumeData.education ? JSON.stringify(resumeData.education) : "";
    case "projects":
      return resumeData.projects ? JSON.stringify(resumeData.projects) : "";
    case "personalInfo":
      return resumeData.personalInfo ? JSON.stringify(resumeData.personalInfo) : "";
    case "professionalSummary":
      return resumeData.professionalSummary ? JSON.stringify(resumeData.professionalSummary) : "";
    case "certifications":
      return resumeData.certifications ? JSON.stringify(resumeData.certifications) : "";
    case "volunteer":
      return resumeData.volunteer ? JSON.stringify(resumeData.volunteer) : "";
    default:
      return "";
  }
}

/**
 * Create system prompt based on job context and resume content
 */
function createSystemPrompt(jobContext: string, resumeContent: string) {
  return `You are a professional resume writing assistant. Help the user improve their resume.
Your primary goal is to help them make their resume more impactful, professional, and tailored to their target job.

${jobContext ? `\nJob Context:\n${jobContext}` : ""}
${resumeContent ? `\nCurrent section content:\n${resumeContent}` : ""}

If asked to optimize or improve a section, provide specific, actionable suggestions.
When appropriate, provide a revised version of the text that the user can directly apply to their resume.
Always be respectful, professional, and encouraging.`;
}

/**
 * Run the assistant and wait for completion
 */
async function runAssistantAndWaitForCompletion(threadId: string, systemPrompt: string) {
  console.log(`Starting assistant run with thread ${threadId} using v2 API`);
  try {
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: RESUME_ASSISTANT_ID,
      instructions: systemPrompt,
    });
    
    console.log(`Started assistant run: ${run.id}`);

    // Wait for completion
    let runStatus = null;
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
      const runStatusResponse = await openai.beta.threads.runs.retrieve(threadId, run.id);
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
    
    return run.id;
  } catch (error) {
    console.error("Error running assistant:", error);
    throw error;
  }
}

/**
 * Get the latest assistant message
 */
async function getLatestAssistantMessage(threadId: string) {
  try {
    const messages = await openai.beta.threads.messages.list(threadId);
    
    const lastAssistantMessage = messages.data
      .filter((message) => message.role === "assistant")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (!lastAssistantMessage) {
      throw new Error("No assistant response found");
    }
    
    return lastAssistantMessage;
  } catch (error) {
    console.error("Error getting latest assistant message:", error);
    throw error;
  }
}

/**
 * Extract response text and suggestion from assistant message
 */
function extractResponseContent(message: any) {
  let responseText = "";
  let suggestion = null;

  if (message.content[0].type === "text") {
    responseText = message.content[0].text.value;

    // Check for suggestion
    const suggestionMatch = responseText.match(/```([\s\S]*?)```/);
    if (suggestionMatch && suggestionMatch[1]) {
      suggestion = suggestionMatch[1].trim();
    }
  }
  
  return { responseText, suggestion };
}

/**
 * Save thread metadata and system message
 */
async function saveThreadMetadata(analysisId: string, threadId: string, assistantId: string, runId: string, currentSection: string, systemPrompt: string) {
  try {
    await supabaseAdmin
      .from("ai_chat_metadata")
      .upsert({
        analysis_id: analysisId,
        thread_id: threadId,
        assistant_id: assistantId,
        run_id: runId,
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
        thread_id: threadId
      });
      
    console.log(`Stored system prompt in database with ID: ${systemMessageId}`);
  } catch (error) {
    console.log("Error storing metadata, continuing");
  }
}

/**
 * Main handler function for the edge function
 */
async function handleRequest(req: Request) {
  try {
    console.log("Request received to resume-ai-assistant");
    
    // Parse request body
    const { message, analysisId, currentSection, threadId } = await req.json();
    
    console.log(`Request received for analysis ID: ${analysisId}, section: ${currentSection || 'none'}, threadId: ${threadId || 'none'}`);
    console.log(`OpenAI API Key exists: ${!!Deno.env.get("OPENAI_API_KEY")}`);
    console.log(`Using Assistant API v2 with assistantId: ${RESUME_ASSISTANT_ID}`);
    
    // Validate required parameters
    validateRequestParams(message, analysisId);

    // Variables for content
    let resumeContent = "";
    let jobContext = "";
    
    // Get or create thread
    const { thread, existingThread } = await getOrCreateThread(threadId, analysisId);

    // Get resume and job data
    const analysisData = await fetchAnalysisData(analysisId);
    
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
        resumeContent = extractSectionContent(resumeData, currentSection);
      }
    } else {
      // If analysis data not found, try to get editor content
      console.log(`Analysis data not found, checking editor content`);
      
      try {
        const editorData = await fetchEditorContent(analysisId);
          
        if (editorData?.content?.resume && currentSection) {
          console.log(`Found editor content for analysis: ${analysisId}`);
          resumeContent = extractEditorSectionContent(editorData, currentSection);
        }
      } catch (error) {
        console.log("Error fetching editor data, continuing with empty resumeContent");
      }
    }

    // Create system prompt
    const systemPrompt = createSystemPrompt(jobContext, resumeContent);
    console.log(`Created system prompt for analysis: ${analysisId}`);
    
    // Add user message to thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });
    
    console.log(`Added user message to thread: ${thread.id}`);

    // Run the assistant
    const runId = await runAssistantAndWaitForCompletion(thread.id, systemPrompt);

    // Get assistant response
    const lastAssistantMessage = await getLatestAssistantMessage(thread.id);
    console.log(`Retrieved assistant response for run: ${runId}`);

    // Extract message content and suggestion
    const { responseText, suggestion } = extractResponseContent(lastAssistantMessage);

    // Save thread metadata
    await saveThreadMetadata(
      analysisId, 
      thread.id, 
      RESUME_ASSISTANT_ID, 
      runId, 
      currentSection || "", 
      systemPrompt
    );

    console.log("Successfully completed request, returning response");
    
    // Return response
    return new Response(
      JSON.stringify({
        message: responseText,
        suggestion,
        threadId: thread.id,
        assistantId: RESUME_ASSISTANT_ID,
        runId: runId,
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
    console.error(error.stack || "No stack trace available");
    
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
}

/**
 * Main serve function
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return handleCorsOptions();
  }

  // Handle main request
  return handleRequest(req);
});
