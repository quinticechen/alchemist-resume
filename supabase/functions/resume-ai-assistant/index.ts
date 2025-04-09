// Resume AI Assistant Edge Function
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import OpenAI from "https://esm.sh/openai@4.24.1";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY") || "",
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
    const requestBody = await req.json();
    const { message, analysisId, resumeId, currentSection, history, threadId, includeJobData } = requestBody;
    
    console.log(`Request received with params:`, {
      analysisId: analysisId || "none", 
      resumeId: resumeId || "none", 
      section: currentSection || "none",
      threadId: threadId || "none",
    });

    // Validate required parameters
    if (!message) {
      throw new Error("Missing required parameter: message");
    }
    
    if (!analysisId) {
      throw new Error("Missing required parameter: analysisId");
    }

    console.log(`Attempting to fetch analysis data for ID: ${analysisId}`);
    
    // First try to get any data from resume_analyses to ensure the ID exists
    try {
      const { data: basicCheck, error: basicCheckError } = await supabaseAdmin
        .from("resume_analyses")
        .select("id, resume_id, job_id")
        .eq("id", analysisId)
        .maybeSingle();
        
      if (basicCheckError) {
        console.error(`Basic check error: ${basicCheckError.message}`);
      }
      
      if (!basicCheck) {
        console.error(`No analysis found with ID: ${analysisId}`);
        // Fall back to minimal data handling since we can't find the analysis
        return await handleWithMinimalData(message, analysisId, null, null, currentSection, history, threadId);
      }
      
      console.log(`Basic check successful, found analysis with ID: ${analysisId}`);
      console.log(`Associated resume_id: ${basicCheck.resume_id}, job_id: ${basicCheck.job_id}`);
      
      // Continue with detailed data fetch since we know the ID exists
    } catch (checkError) {
      console.error(`Error in basic check: ${checkError.message}`);
      // Proceed with detailed query, it might still work
    }
    
    // Get detailed resume data from the database
    try {
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
        .maybeSingle();

      if (analysisError) {
        console.error(`Error fetching analysis data: ${analysisError.message}`);
        // Try to get editor content directly as a fallback
        return await handleWithEditorContent(message, analysisId, currentSection, history, threadId);
      }

      if (!analysisData) {
        console.error(`No analysis data found for ID: ${analysisId}`);
        // Try to get editor content directly as a fallback
        return await handleWithEditorContent(message, analysisId, currentSection, history, threadId);
      }

      console.log(`Successfully retrieved analysis data for ID: ${analysisId}`);
      
      // Get or create a thread based on the analysisId
      let thread;
      
      if (threadId) {
        // Use provided thread ID if available
        console.log(`Attempting to use existing thread: ${threadId}`);
        try {
          thread = await openai.beta.threads.retrieve(threadId);
          console.log(`Successfully retrieved thread: ${threadId}`);
        } catch (threadError) {
          console.error(`Error retrieving thread: ${threadError.message}`);
          console.log("Creating new thread instead");
          thread = await openai.beta.threads.create();
          console.log(`Created new thread: ${thread.id}`);
        }
      } else {
        // If no thread ID provided, check if one exists for this analysis
        try {
          const { data: metadataData, error: metadataError } = await supabaseAdmin
            .from("ai_chat_metadata")
            .select("thread_id")
            .eq("analysis_id", analysisId)
            .order("created_at", { ascending: false })
            .limit(1);

          if (!metadataError && metadataData && metadataData.length > 0) {
            // Use existing thread for this analysis
            const existingThreadId = metadataData[0].thread_id;
            console.log(`Found existing thread for analysis: ${existingThreadId}`);
            try {
              thread = await openai.beta.threads.retrieve(existingThreadId);
              console.log(`Successfully retrieved existing thread: ${existingThreadId}`);
            } catch (threadRetrieveError) {
              console.error(`Error retrieving existing thread: ${threadRetrieveError.message}`);
              thread = await openai.beta.threads.create();
              console.log(`Created new thread after failed retrieval: ${thread.id}`);
            }
          } else {
            // Create new thread if none exists
            console.log("No existing thread found, creating new thread");
            thread = await openai.beta.threads.create();
            console.log(`Created new thread: ${thread.id}`);
          }
        } catch (dbError) {
          console.error(`Error checking for existing thread: ${dbError.message}`);
          thread = await openai.beta.threads.create();
          console.log(`Created new thread after error: ${thread.id}`);
        }
      }

      // Extract resume content for the specified section
      const resumeData = analysisData.resume?.formatted_resume;
      let sectionContent = "";

      // Only include section content if a specific section is requested
      if (currentSection && resumeData) {
        if (currentSection === "skills" && resumeData.skills) {
          sectionContent = JSON.stringify(resumeData.skills);
        } else if (currentSection === "professionalExperience" && resumeData.experience) {
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

      // Prepare job description context if available and requested
      let jobContext = "";
      if (includeJobData !== false && analysisData.job && analysisData.job.job_description) {
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

      console.log("System prompt prepared, adding user message to thread");

      try {
        // Add user message to thread
        await openai.beta.threads.messages.create(thread.id, {
          role: "user",
          content: message,
        });
        console.log("Added user message to thread");

        // Run the assistant
        const run = await openai.beta.threads.runs.create(thread.id, {
          assistant_id: RESUME_ASSISTANT_ID,
          instructions: systemPrompt,
        });
        console.log(`Started assistant run: ${run.id}`);

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

          console.log(`Run status: ${runStatus} (attempt ${timeoutCounter + 1})`);

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
          throw new Error(`Assistant run timed out or failed with status: ${runStatus}`);
        }

        // Retrieve messages
        const messages = await openai.beta.threads.messages.list(thread.id);
        console.log(`Retrieved ${messages.data.length} messages from thread`);
        
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
        
        // Store system prompt in database
        try {
          await supabaseAdmin
            .from("ai_chat_messages")
            .insert({
              id: crypto.randomUUID(),
              role: "system",
              content: systemPrompt,
              timestamp: new Date().toISOString(),
              analysis_id: analysisId,
              section: currentSection,
              thread_id: thread.id
            });
          console.log("Stored system prompt in database");
        } catch (systemPromptError) {
          console.error("Error storing system prompt:", systemPromptError);
        }
        
        // Update or create thread metadata
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
          console.log("Stored thread metadata in database");
        } catch (metadataError) {
          console.error("Error storing thread metadata:", metadataError);
        }
        
        // Return the response with thread information
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
      } catch (openaiError) {
        console.error("Error in OpenAI interaction:", openaiError.message);
        throw new Error(`OpenAI interaction error: ${openaiError.message}`);
      }
    } catch (error) {
      console.error(`Error fetching analysis data: ${error.message}`);
      return await handleWithMinimalData(message, analysisId, null, null, currentSection, history, threadId);
    }
  } catch (error) {
    console.error("Error in resume-ai-assistant function:", error.message);
    console.error(error.stack);
    
    return new Response(
      JSON.stringify({
        error: `Resume AI Assistant Error: ${error.message}`,
        message: "I'm experiencing technical difficulties. Please try again later.",
      }),
      {
        status: 200, // Return 200 even with error to prevent UI errors
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

// Handler for when we have editor content but no analysis data
async function handleWithEditorContent(message, analysisId, currentSection, history, threadId) {
  try {
    console.log(`Attempting to fetch editor content for analysis: ${analysisId}`);
    
    const { data: editorData, error: editorError } = await supabaseAdmin
      .from('resume_editors')
      .select('content')
      .eq('analysis_id', analysisId)
      .maybeSingle();
    
    if (editorError || !editorData || !editorData.content) {
      console.error(`Error or no content in editor data: ${editorError?.message || "No content"}`);
      return await handleWithMinimalData(message, analysisId, null, null, currentSection, history, threadId);
    }
    
    console.log(`Successfully retrieved editor content for analysis: ${analysisId}`);
    
    // Get or create a thread
    let thread;
    
    if (threadId) {
      try {
        thread = await openai.beta.threads.retrieve(threadId);
        console.log(`Successfully retrieved thread: ${threadId}`);
      } catch (threadError) {
        console.error(`Error retrieving thread: ${threadError.message}`);
        thread = await openai.beta.threads.create();
        console.log(`Created new thread: ${thread.id}`);
      }
    } else {
      // Create new thread
      thread = await openai.beta.threads.create();
      console.log(`Created new thread: ${thread.id}`);
    }
    
    // Extract section content from editor data
    const resumeData = editorData.content.resume || {};
    let sectionContent = "";
    
    if (currentSection && resumeData) {
      if (currentSection === "skills" && resumeData.skills) {
        sectionContent = JSON.stringify(resumeData.skills);
      } else if (currentSection === "professionalExperience" && resumeData.professionalExperience) {
        sectionContent = JSON.stringify(resumeData.professionalExperience);
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
    
    // Create system prompt with available content
    const systemPrompt = `You are a professional resume writing assistant. Help the user improve their resume.
Your primary goal is to help them make their resume more impactful, professional, and tailored to their target job.

${sectionContent ? `\nCurrent section content:\n${sectionContent}` : ""}

If asked to optimize or improve a section, provide specific, actionable suggestions.
When appropriate, provide a revised version of the text that the user can directly apply to their resume.
Always be respectful, professional, and encouraging.`;

    // Add user message to thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });
    console.log("Added user message to thread in editor mode");
    
    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: RESUME_ASSISTANT_ID,
      instructions: systemPrompt,
    });
    console.log(`Started assistant run in editor mode: ${run.id}`);
    
    // Poll for completion
    let runStatus;
    let timeoutCounter = 0;
    const maxTimeout = 60;
    
    while (timeoutCounter < maxTimeout) {
      const runStatusResponse = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );
      runStatus = runStatusResponse.status;
      
      console.log(`Run status in editor mode: ${runStatus} (attempt ${timeoutCounter + 1})`);
      
      if (runStatus === "completed") break;
      if (runStatus === "failed" || runStatus === "cancelled" || runStatus === "expired") {
        throw new Error(`Run failed in editor mode with status: ${runStatus}`);
      }
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      timeoutCounter++;
    }
    
    if (runStatus !== "completed") {
      throw new Error(`Assistant run timed out in editor mode with status: ${runStatus}`);
    }
    
    // Get the assistant response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastAssistantMessage = messages.data
      .filter((msg) => msg.role === "assistant")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      
    if (!lastAssistantMessage) {
      throw new Error("No assistant response found in editor mode");
    }
    
    let responseText = "";
    let suggestion = null;
    
    if (lastAssistantMessage.content[0].type === "text") {
      responseText = lastAssistantMessage.content[0].text.value;
      
      // Check for revision suggestion
      const suggestionMatch = responseText.match(/```([\s\S]*?)```/);
      if (suggestionMatch && suggestionMatch[1]) {
        suggestion = suggestionMatch[1].trim();
      }
    }
    
    console.log("Assistant response generated successfully in editor mode");
    
    // Store metadata
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
      console.log("Stored thread metadata in editor mode");
    } catch (metadataError) {
      console.error("Error storing thread metadata in editor mode:", metadataError.message);
    }
    
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
    console.error(`Error in handleWithEditorContent: ${error.message}`);
    return await handleWithMinimalData(message, analysisId, null, null, currentSection, history, threadId);
  }
}

// Handler for case when we don't have full data but can still provide chat functionality
async function handleWithMinimalData(message, analysisId, resumeId, jobId, currentSection, history, threadId) {
  try {
    console.log(`Handling with minimal data for analysis: ${analysisId}, resumeId: ${resumeId || "unknown"}, jobId: ${jobId || "unknown"}`);
    
    // Get or create a thread
    let thread;
    
    if (threadId) {
      try {
        thread = await openai.beta.threads.retrieve(threadId);
        console.log(`Successfully retrieved thread: ${threadId}`);
      } catch (threadError) {
        console.error(`Error retrieving thread in minimal mode: ${threadError.message}`);
        thread = await openai.beta.threads.create();
        console.log(`Created new thread in minimal mode: ${thread.id}`);
      }
    } else {
      console.log("No thread ID provided in minimal mode, creating new thread");
      thread = await openai.beta.threads.create();
      console.log(`Created new thread in minimal mode: ${thread.id}`);
    }

    // Create a simplified system prompt
    const systemPrompt = `You are a professional resume writing assistant. Help the user improve their resume.
Your primary goal is to help them make their resume more impactful and professional.

You'll need to ask the user for specific details about their resume, as I don't have access to their full resume data right now.

If asked to optimize or improve a section, provide general advice and ask for more details about their current content.
Always be respectful, professional, and encouraging.`;

    // Add user message to thread  
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });
    console.log("Added user message to thread in minimal mode");
    
    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: RESUME_ASSISTANT_ID,
      instructions: systemPrompt,
    });
    console.log(`Started assistant run in minimal mode: ${run.id}`);
    
    // Poll for completion
    let runStatus;
    let timeoutCounter = 0;
    const maxTimeout = 60;
    
    while (timeoutCounter < maxTimeout) {
      const runStatusResponse = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );
      runStatus = runStatusResponse.status;
      
      console.log(`Run status in minimal mode: ${runStatus} (attempt ${timeoutCounter + 1})`);
      
      if (runStatus === "completed") break;
      if (runStatus === "failed" || runStatus === "cancelled" || runStatus === "expired") {
        throw new Error(`Run failed in minimal mode with status: ${runStatus}`);
      }
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      timeoutCounter++;
    }
    
    if (runStatus !== "completed") {
      throw new Error(`Assistant run timed out in minimal mode with status: ${runStatus}`);
    }
    
    // Get the assistant response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastAssistantMessage = messages.data
      .filter((msg) => msg.role === "assistant")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      
    if (!lastAssistantMessage) {
      throw new Error("No assistant response found in minimal mode");
    }
    
    let responseText = "";
    if (lastAssistantMessage.content[0].type === "text") {
      responseText = lastAssistantMessage.content[0].text.value;
    }
    
    console.log("Assistant response generated successfully in minimal mode");
    
    // Try to store metadata
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
      console.log("Stored thread metadata in minimal mode");
    } catch (metadataError) {
      console.error("Error storing thread metadata in minimal mode:", metadataError.message);
    }
    
    return new Response(
      JSON.stringify({
        message: responseText,
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
    console.error("Error in minimal data handler:", error.message);
    console.error(error.stack);
    
    return new Response(
      JSON.stringify({
        error: `Minimal Data Handler Error: ${error.message}`,
        message: "I'm having trouble accessing your resume data right now. How can I help you in general with resume advice?",
        threadId: null
      }),
      {
        status: 200, // Return 200 even with error to prevent UI errors
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
}

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
          maybeSingle: () => {
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
                  return { data: null, error: null };
                } else if (data.error) {
                  return { data: null, error: data.error };
                }
                return { data: null, error: null };
              })
              .catch((error) => {
                return { data: null, error: { message: error.message } };
              });
          },
          // Add additional functions for handling other queries
          limit: (limit) => ({
            order: (column, { ascending }) => {
              const order = ascending ? 'asc' : 'desc';
              return {
                // Function to get data with limit and order
                then: async (callback) => {
                  try {
                    const response = await fetch(
                      `${supabaseUrl}/rest/v1/${table}?select=${query}&${column}=eq.${value}&order=${column}.${order}&limit=${limit}`,
                      {
                        headers: {
                          ApiKey: supabaseKey,
                          Authorization: `Bearer ${supabaseKey}`,
                          "Content-Type": "application/json",
                        },
                      }
                    );
                    const data = await response.json();
                    return callback({ data, error: null });
                  } catch (error) {
                    return callback({ data: null, error: { message: error.message } });
                  }
                },
              };
            },
          }),
          order: (column, { ascending }) => ({
            limit: (limit) => {
              const order = ascending ? 'asc' : 'desc';
              return {
                // Function to get data with order and limit
                then: async (callback) => {
                  try {
                    const response = await fetch(
                      `${supabaseUrl}/rest/v1/${table}?select=${query}&${column}=eq.${value}&order=${column}.${order}&limit=${limit}`,
                      {
                        headers: {
                          ApiKey: supabaseKey,
                          Authorization: `Bearer ${supabaseKey}`,
                          "Content-Type": "application/json",
                        },
                      }
                    );
                    const data = await response.json();
                    return callback({ data, error: null });
                  } catch (error) {
                    return callback({ data: null, error: { message: error.message } });
                  }
                },
              };
            },
          }),
        }),
      }),
      insert: (data) => {
        return fetch(
          `${supabaseUrl}/rest/v1/${table}`,
          {
            method: 'POST',
            headers: {
              ApiKey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              "Prefer": "return=representation",
            },
            body: JSON.stringify(data),
          }
        )
          .then((response) => response.json())
          .then((responseData) => {
            if (responseData.error) {
              return { data: null, error: responseData.error };
            }
            return { data: responseData, error: null };
          })
          .catch((error) => {
            return { data: null, error: { message: error.message } };
          });
      },
      upsert: (data, { onConflict }) => {
        return fetch(
          `${supabaseUrl}/rest/v1/${table}`,
          {
            method: 'POST',
            headers: {
              ApiKey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              "Prefer": "resolution=merge-duplicates",
              ...(onConflict ? { "onConflict": onConflict } : {})
            },
            body: JSON.stringify(data),
          }
        )
          .then((response) => response.json())
          .then((responseData) => {
            if (responseData.error) {
              return { data: null, error: responseData.error };
            }
            return { data: responseData, error: null };
          })
          .catch((error) => {
            return { data: null, error: { message: error.message } };
          });
      }
    }),
  };
}
