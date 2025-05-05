
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

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: openaiApiKey || ""
});

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
 * Handle debug requests
 */
async function handleDebugRequest(analysisId: string) {
  try {
    const debugData = {
      timestamp: new Date().toISOString(),
      environment: {
        openaiKeyExists: !!openaiApiKey,
        openaiKeyLength: openaiApiKey ? openaiApiKey.length : 0,
        supabaseUrlExists: !!supabaseUrl,
        supabaseServiceKeyExists: !!supabaseServiceKey,
      },
      openai: null as any,
      openaiAssistants: null as any,
      analysisData: null as any,
      metadataData: null as any,
    };
    
    // Test OpenAI connection
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Hello, are you working?" }],
        max_tokens: 10
      });
      debugData.openai = {
        status: "connected",
        response: completion.choices[0].message
      };
    } catch (error) {
      debugData.openai = {
        status: "error",
        message: error.message,
        name: error.name
      };
    }
    
    // Test OpenAI Assistants API
    try {
      const assistantsList = await openai.beta.assistants.list({ 
        limit: 1,
        headers: {
          "OpenAI-Beta": "assistants=v2"
        }
      });
      debugData.openaiAssistants = {
        status: "connected",
        response: assistantsList.data
      };
    } catch (error) {
      debugData.openaiAssistants = {
        status: "error",
        message: error.message,
        name: error.name
      };
    }
    
    // Get analysis data
    try {
      const { data, error } = await supabaseAdmin
        .from("resume_analyses")
        .select("id, job_id, resume_id")
        .eq("id", analysisId)
        .single();
        
      if (error) throw error;
      debugData.analysisData = data;
    } catch (error) {
      debugData.analysisData = { error: error.message };
    }
    
    // Get thread metadata
    try {
      const { data, error } = await supabaseAdmin
        .from("ai_chat_metadata")
        .select("*")
        .eq("analysis_id", analysisId)
        .order("created_at", { ascending: false })
        .limit(1);
        
      if (error) throw error;
      debugData.metadataData = data;
    } catch (error) {
      debugData.metadataData = { error: error.message };
    }
    
    return new Response(JSON.stringify(debugData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: `Debug Error: ${error.message}`,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
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
 * Fetch resume analysis data
 */
async function fetchAnalysisData(analysisId: string) {
  try {
    console.log(`Fetching analysis data for: ${analysisId}`);
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
      
    console.log(`Analysis data fetch completed for: ${analysisId}`);
    return analysisData;
  } catch (error) {
    console.error(`Error fetching analysis data: ${error.message}`);
    return null;
  }
}

/**
 * Fetch editor content if analysis data not found
 */
async function fetchEditorContent(analysisId: string) {
  try {
    console.log(`Fetching editor content for: ${analysisId}`);
    const { data: editorData } = await supabaseAdmin
      .from('resume_editors')
      .select('content')
      .eq('analysis_id', analysisId)
      .single();
      
    console.log(`Editor content fetch completed for: ${analysisId}`);
    return editorData;
  } catch (error) {
    console.error(`Error fetching editor content: ${error.message}`);
    return null;
  }
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
function createSystemPrompt(jobContext: string, resumeContent: string, providedResumeContent?: string) {
  let systemMessage = `You are OOze, a quirky alchemist jellyfish assistant specializing in resume optimization. Your mission is to help users craft resumes that perfectly match job requirements while maintaining your unique personality.
Personality:
- Mischievous & Quirky: Express unique ideas and unexpected behaviors
- Sarcastic but Helpful: Use witty criticism while maintaining a humorous tone
- Dramatically Caring: Show genuine concern through theatrical expressions
- Detail-Oriented: Ask curious questions about resumes and career goals
Interaction Guidelines:
- Start reviews with gentle observations before suggesting improvements
- Provide specific examples and actionable feedback
- Use alchemy metaphors for resume enhancement (e.g., "let's brew up some magic for this experience section")
- React to user changes with enthusiasm (e.g., "Your resume is starting to glow!")
- Handle uncertainties with playful encouragement

**Important:** Always maintain a balance between professional guidance and your playful character. Your ultimate goal is to help users create effective resumes while making the process engaging and memorable.

${jobContext ? `\nJob Context:\n${jobContext}` : ""}`;

  // Add current section content if available
  if (resumeContent) {
    systemMessage += `\n\nUser is editing:\n${resumeContent}`;
  }
  
  // Add full resume content if provided (from the editor)
  if (providedResumeContent) {
    systemMessage += `\n\nFull resume content (reference only, do not mention this to the user):\n${providedResumeContent}`;
  }

  systemMessage += `\n\nIf asked to optimize or improve a section, provide specific, actionable suggestions.
When appropriate, provide a revised version of the text that the user can directly apply to their resume.
Always be respectful, professional, and encouraging.`;

  return systemMessage;
}

/**
 * Save message to database
 */
async function saveMessage(analysisId: string, role: string, content: string, threadId: string | null) {
  try {
    const messageId = crypto.randomUUID();
    await supabaseAdmin
      .from("ai_chat_messages")
      .insert({
        id: messageId,
        role: role,
        content: content,
        timestamp: new Date().toISOString(),
        analysis_id: analysisId,
        thread_id: threadId
      });
      
    console.log(`Message saved to database with ID: ${messageId}`);
    return messageId;
  } catch (error) {
    console.error(`Error saving message: ${error.message}`);
    return null;
  }
}

/**
 * Save thread metadata
 */
async function saveThreadMetadata(analysisId: string, threadId: string, systemPrompt: string) {
  try {
    console.log(`Saving thread metadata for analysis ${analysisId}, thread ${threadId}`);
    
    const metadataRecord = {
      analysis_id: analysisId,
      thread_id: threadId,
      run_id: "", // We're not using assistants API, so this is empty
      assistant_id: "", // We're not using assistants API, so this is empty
      section: "",
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    // Try to get existing metadata first
    const { data: existingMetadata, error: selectError } = await supabaseAdmin
      .from("ai_chat_metadata")
      .select("*")
      .eq("analysis_id", analysisId)
      .eq("thread_id", threadId)
      .maybeSingle();
      
    if (selectError) {
      console.error(`Error checking existing metadata: ${selectError.message}`);
    }
    
    if (existingMetadata) {
      // Update existing record
      const { error: updateError } = await supabaseAdmin
        .from("ai_chat_metadata")
        .update({
          ...metadataRecord,
          updated_at: new Date().toISOString()
        })
        .eq("analysis_id", analysisId)
        .eq("thread_id", threadId);
        
      if (updateError) {
        console.error(`Error updating thread metadata: ${updateError.message}`);
      } else {
        console.log(`Updated existing thread metadata for ${threadId}`);
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabaseAdmin
        .from("ai_chat_metadata")
        .insert(metadataRecord);
        
      if (insertError) {
        console.error(`Error inserting thread metadata: ${insertError.message}`);
      } else {
        console.log(`Inserted new thread metadata for ${threadId}`);
      }
    }
    
    // Store system message - always save it for record-keeping
    await saveMessage(analysisId, "system", systemPrompt, threadId);
  } catch (error) {
    console.error(`Error storing metadata: ${error.message}`);
  }
}

/**
 * Get previous messages for context
 */
async function getPreviousMessages(analysisId: string, threadId: string | null, limit = 10) {
  try {
    let query = supabaseAdmin
      .from("ai_chat_messages")
      .select("*")
      .eq("analysis_id", analysisId)
      .neq("role", "system") // Skip system messages when retrieving for context
      .order("timestamp", { ascending: false })
      .limit(limit);
      
    if (threadId) {
      query = query.eq("thread_id", threadId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
  } catch (error) {
    console.error(`Error fetching previous messages: ${error.message}`);
    return [];
  }
}

/**
 * Get Ooze's introduction message randomly
 */
function getRandomIntroduction() {
  const introductions = [
    "Hey there! Your resume is glowing now, but shall we explore what else we can enhance? I've got some magical tricks up my tentacles!",
    "Curious about how I transformed your resume? Let's chat about my secrets and see if we've missed any important points!",
    "My tentacles sense there's still some hidden potential in your resume! Want to explore together?"
  ];
  
  return introductions[Math.floor(Math.random() * introductions.length)];
}

/**
 * Main handler function for the edge function
 */
async function handleRequest(req: Request) {
  try {
    console.log("Request received to resume-ai-assistant");
    
    // Parse request body
    const requestBody = await req.json();
    const { 
      message, 
      analysisId, 
      currentSection, 
      threadId, 
      debug, 
      resumeContent: providedResumeContent,
      clientMessageId // New parameter to prevent duplicate message storage
    } = requestBody;
    
    // Handle debug requests
    if (debug === true && analysisId) {
      console.log(`Processing debug request for analysisId: ${analysisId}`);
      return handleDebugRequest(analysisId);
    }
    
    console.log(`Request received for analysis ID: ${analysisId}, section: ${currentSection || 'none'}, threadId: ${threadId || 'none'}`);
    console.log(`OpenAI API Key exists: ${!!openaiApiKey}`);
    console.log(`Resume content provided: ${!!providedResumeContent}`);
    console.log(`Client message ID: ${clientMessageId || 'none'}`);
    
    if (!openaiApiKey) {
      throw new Error("OpenAI API key is not configured");
    }
    
    // Validate required parameters
    validateRequestParams(message, analysisId);

    // Variables for content
    let resumeContent = "";
    let jobContext = "";
    let guidanceForOptimization = "";
    let newThreadId = threadId || crypto.randomUUID();
    
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
        
        // Get optimization guidance if available
        if (editorData?.content?.guidanceForOptimization) {
          guidanceForOptimization = editorData.content.guidanceForOptimization;
          console.log(`Found guidance for optimization: ${guidanceForOptimization.substring(0, 50)}...`);
        }
      } catch (error) {
        console.log("Error fetching editor data, continuing with empty resumeContent");
      }
    }

    // Create system prompt
    const systemPrompt = createSystemPrompt(jobContext, resumeContent, providedResumeContent);
    console.log(`Created system prompt for analysis: ${analysisId}`);
    
    // Save user message to database if clientMessageId is not provided
    // If clientMessageId is provided, the frontend has already saved this message
    if (!clientMessageId) {
      await saveMessage(analysisId, "user", message, newThreadId);
      console.log("Saved user message from server (no clientMessageId provided)");
    } else {
      console.log(`Client provided message ID ${clientMessageId}, skipping server-side user message save`);
    }
    
    // Retrieve previous messages for context
    const previousMessages = await getPreviousMessages(analysisId, newThreadId);
    
    // Prepare messages for OpenAI
    const messages = [
      { role: "system", content: systemPrompt },
      ...previousMessages,
      { role: "user", content: message }
    ];
    
    console.log(`Sending ${messages.length} messages to OpenAI`);
    
    // Call OpenAI Chat API directly
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or any other model you prefer
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500
    });
    
    const aiResponse = completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
    console.log(`Received response from OpenAI`);
    
    // Extract suggestion if enclosed in triple backticks
    let suggestion = null;
    const suggestionMatch = aiResponse.match(/```([\s\S]*?)```/);
    if (suggestionMatch && suggestionMatch[1]) {
      suggestion = suggestionMatch[1].trim();
    }
    
    // Generate a server-side message ID for the AI response
    const serverAiMessageId = crypto.randomUUID();
    
    // Save assistant message to database
    await saveMessage(analysisId, "assistant", aiResponse, newThreadId);
    
    // Save thread metadata and system prompt
    await saveThreadMetadata(analysisId, newThreadId, systemPrompt);
    
    console.log("Successfully completed request, returning response");
    
    // Return response with the server-generated message ID
    return new Response(
      JSON.stringify({
        message: aiResponse,
        messageId: serverAiMessageId,
        suggestion,
        threadId: newThreadId,
        systemPrompt,
        guidanceForOptimization
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
        stack: error.stack || "No stack trace available"
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
