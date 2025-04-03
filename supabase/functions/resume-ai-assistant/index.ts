
// Resume AI Assistant Edge Function
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import OpenAI from "https://esm.sh/openai@4.24.1";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

// Define assistant ID(s)
const RESUME_ASSISTANT_ID = "asst_ahHD2JpnG0XCsHVBbCSUmRVr";

serve(async (req) => {
  console.log("Resume AI Assistant function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, analysisId, resumeId, currentSection, history, threadId } = await req.json();
    console.log(`Request received: analysisId=${analysisId}, resumeId=${resumeId}, section=${currentSection}`);
    console.log(`Previous threadId: ${threadId || "none"}`);

    // Validate required parameters
    if (!message || !analysisId || !resumeId) {
      throw new Error("Missing required parameters");
    }

    // Get resume data from the database
    const { data: analysisData, error: analysisError } = await supabaseAdmin
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

    if (analysisError) {
      throw new Error(`Error fetching analysis data: ${analysisError.message}`);
    }

    if (!analysisData?.resume?.formatted_resume) {
      throw new Error("Resume data not found");
    }

    // Get or create a thread
    let thread;
    if (threadId) {
      console.log(`Using existing thread: ${threadId}`);
      try {
        thread = await openai.beta.threads.retrieve(threadId);
      } catch (threadError) {
        console.error(`Error retrieving thread: ${threadError}`);
        console.log("Creating new thread instead");
        thread = await openai.beta.threads.create();
      }
    } else {
      console.log("Creating new thread");
      thread = await openai.beta.threads.create();
    }
    
    console.log(`Thread ID: ${thread.id}`);

    // Extract resume content for the specified section
    const resumeData = analysisData.resume.formatted_resume;
    let sectionContent = "";

    // Only include section content if a specific section is requested
    if (currentSection && resumeData) {
      if (currentSection === "skills" && resumeData.skills) {
        sectionContent = JSON.stringify(resumeData.skills);
      } else if (currentSection === "experience" && resumeData.experience) {
        sectionContent = JSON.stringify(resumeData.experience);
      } else if (currentSection === "education" && resumeData.education) {
        sectionContent = JSON.stringify(resumeData.education);
      } else if (currentSection === "projects" && resumeData.projects) {
        sectionContent = JSON.stringify(resumeData.projects);
      } else if (currentSection === "personalInfo" && resumeData.personalInfo) {
        sectionContent = JSON.stringify(resumeData.personalInfo);
      } else if (currentSection === "professionalSummary" && resumeData.professionalSummary) {
        sectionContent = JSON.stringify(resumeData.professionalSummary);
      } else if (currentSection === "certifications" && resumeData.certifications) {
        sectionContent = JSON.stringify(resumeData.certifications);
      } else if (currentSection === "volunteer" && resumeData.volunteer) {
        sectionContent = JSON.stringify(resumeData.volunteer);
      }
    }

    // Prepare job description context if available
    let jobContext = "";
    if (analysisData.job && analysisData.job.job_description) {
      const jobTitle = analysisData.job.job_title || "Unknown position";
      const companyName = analysisData.job.company_name || "Unknown company";
      jobContext = `The user is applying for "${jobTitle}" at "${companyName}". The job description is: ${JSON.stringify(analysisData.job.job_description)}`;
    }

    // Create a system message with context
    let systemPrompt = `You are a professional resume writing assistant. Help the user improve their resume.
Your primary goal is to help them make their resume more impactful, professional, and tailored to their target job.

${jobContext ? `\nJob Context:\n${jobContext}` : ""}
${sectionContent ? `\nCurrent section content:\n${sectionContent}` : ""}

If asked to optimize or improve a section, provide specific, actionable suggestions.
When appropriate, provide a revised version of the text that the user can directly apply to their resume.
Always be respectful, professional, and encouraging.`;

    // Log the system prompt for debugging
    console.log("System prompt:", systemPrompt);

    // Add user message to thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: RESUME_ASSISTANT_ID,
      instructions: systemPrompt,
    });

    // Poll for completion
    let runStatus;
    let timeoutCounter = 0;
    const maxTimeout = 60; // Maximum 60 seconds wait

    while (timeoutCounter < maxTimeout) {
      const runStatusResponse = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );
      runStatus = runStatusResponse.status;

      console.log(`Run status: ${runStatus}`);

      if (runStatus === "completed") {
        break;
      } else if (runStatus === "failed" || runStatus === "cancelled" || runStatus === "expired") {
        throw new Error(`Run failed with status: ${runStatus}`);
      }

      // Wait before checking again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      timeoutCounter++;
    }

    if (runStatus !== "completed") {
      throw new Error("Assistant run timed out or failed");
    }

    // Retrieve messages
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    // Get the latest assistant message
    const lastAssistantMessage = messages.data
      .filter((message) => message.role === "assistant")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (!lastAssistantMessage) {
      throw new Error("No assistant response found");
    }

    // Extract message content
    let responseText = "";
    let suggestion = null;

    if (lastAssistantMessage.content[0].type === "text") {
      responseText = lastAssistantMessage.content[0].text.value;

      // Check if the response contains a suggested revision (marked with triple backticks)
      const suggestionMatch = responseText.match(/```([\s\S]*?)```/);
      if (suggestionMatch && suggestionMatch[1]) {
        suggestion = suggestionMatch[1].trim();
      }
    }

    console.log("Assistant response generated successfully");
    
    // Return the response with thread information
    return new Response(
      JSON.stringify({
        message: responseText,
        suggestion,
        threadId: thread.id,
        assistantId: RESUME_ASSISTANT_ID,
        runId: run.id
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in resume-ai-assistant function:", error.message);
    
    return new Response(
      JSON.stringify({
        error: `Resume AI Assistant Error: ${error.message}`,
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

// Supabase client with admin privileges for database operations
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Function to create a Supabase client
function createClient(supabaseUrl, supabaseKey) {
  return {
    from: (table) => ({
      select: (query) => ({
        eq: (column, value) => ({
          single: () => {
            // Make a fetch request to the Supabase API
            return fetch(
              `${supabaseUrl}/rest/v1/${table}?select=${query}&${column}=eq.${value}&limit=1`,
              {
                headers: {
                  ApiKey: supabaseKey,
                  Authorization: `Bearer ${supabaseKey}`,
                  "Content-Type": "application/json",
                },
              }
            )
              .then((response) => response.json())
              .then((data) => {
                if (Array.isArray(data) && data.length > 0) {
                  return { data: data[0], error: null };
                } else if (Array.isArray(data) && data.length === 0) {
                  return { data: null, error: { message: "No rows found" } };
                } else if (data.error) {
                  return { data: null, error: data.error };
                }
                return { data: null, error: { message: "Unknown error" } };
              })
              .catch((error) => {
                return { data: null, error: { message: error.message } };
              });
          },
        }),
      }),
    }),
  };
}
