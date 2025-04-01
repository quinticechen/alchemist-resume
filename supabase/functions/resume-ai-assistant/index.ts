
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { message, analysisId, resumeId, currentSection, history, includeJobData = false } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    // Connect to Supabase to get resume data
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables not set');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get resume data and section content
    const { data: resumeData, error: resumeError } = await supabase
      .from('resume_editors')
      .select('content')
      .eq('analysis_id', analysisId)
      .single();

    if (resumeError) {
      throw new Error(`Error fetching resume data: ${resumeError.message}`);
    }

    let sections = {};
    try {
      sections = resumeData.content;
    } catch (error) {
      throw new Error(`Error parsing resume data: ${error.message}`);
    }

    // Get current section content
    let currentSectionContent = 'No content available';
    
    if (sections) {
      if (typeof sections === 'object') {
        if (sections.resume && sections.resume[currentSection]) {
          currentSectionContent = sections.resume[currentSection];
        } else if (sections[currentSection]) {
          currentSectionContent = sections[currentSection];
        }
      }
    }

    // Get job data if it's the first message in the conversation
    let jobData = null;
    if (includeJobData && analysisId) {
      try {
        // First, get the job_id from the analysis
        const { data: analysisData, error: analysisError } = await supabase
          .from('resume_analyses')
          .select('job_id')
          .eq('id', analysisId)
          .single();
          
        if (analysisError) {
          console.error('Error fetching analysis data:', analysisError);
        } else if (analysisData && analysisData.job_id) {
          // Then get the job data
          const { data: jobInfo, error: jobError } = await supabase
            .from('jobs')
            .select('job_description')
            .eq('id', analysisData.job_id)
            .single();
            
          if (jobError) {
            console.error('Error fetching job data:', jobError);
          } else {
            jobData = jobInfo.job_description;
          }
        }
      } catch (error) {
        console.error('Error in job data retrieval:', error);
      }
    }

    const sectionTitle = currentSection === 'personalInfo' ? 'Personal Information' : 
                       currentSection === 'professionalSummary' ? 'Professional Summary' : 
                       currentSection === 'professionalExperience' ? 'Professional Experience' :
                       currentSection === 'education' ? 'Education' :
                       currentSection === 'skills' ? 'Skills' :
                       currentSection === 'projects' ? 'Projects' :
                       currentSection === 'volunteer' ? 'Volunteer Experience' :
                       currentSection === 'certifications' ? 'Certifications' : 'Resume Section';

    // Format current section content for the assistant
    const formattedSectionContent = typeof currentSectionContent === 'object' 
      ? JSON.stringify(currentSectionContent, null, 2) 
      : currentSectionContent;
    
    // Use OpenAI API to interact with your assistant
    const assistantId = "asst_kSRCmsWHioSMYH5W0G04dLU0"; // Your provided assistant ID
    
    try {
      console.log("Creating thread...");
      // Create a thread
      const threadResponse = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openAIApiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v1"
        },
        body: JSON.stringify({})
      });
      
      if (!threadResponse.ok) {
        const errorData = await threadResponse.json();
        throw new Error(`OpenAI thread creation failed: ${JSON.stringify(errorData)}`);
      }
      
      const threadData = await threadResponse.json();
      const threadId = threadData.id;
      console.log("Thread created:", threadId);
      
      // Add message to thread
      console.log("Adding message to thread...");
      
      // Build context message based on whether this is the first message that should include job data
      let contextMessage = `
I'm working on the "${sectionTitle}" section of my resume. Here's the current content:

${formattedSectionContent}
`;

      // Add job data context if available and this is the first message
      if (includeJobData && jobData) {
        contextMessage += `\nHere's the job description I'm targeting:
        
${JSON.stringify(jobData, null, 2)}

Please tailor your suggestions to help me align my resume with this job description.
`;
      }

      // Add the user's actual message
      contextMessage += `\nMy question/request is: ${message}`;
      
      const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openAIApiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v1"
        },
        body: JSON.stringify({
          role: "user",
          content: contextMessage
        })
      });
      
      if (!messageResponse.ok) {
        const errorData = await messageResponse.json();
        throw new Error(`OpenAI message creation failed: ${JSON.stringify(errorData)}`);
      }
      
      console.log("Message added to thread");
      
      // Run the assistant
      console.log("Running assistant...");
      const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openAIApiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v1"
        },
        body: JSON.stringify({
          assistant_id: assistantId
        })
      });
      
      if (!runResponse.ok) {
        const errorData = await runResponse.json();
        throw new Error(`OpenAI run creation failed: ${JSON.stringify(errorData)}`);
      }
      
      const runData = await runResponse.json();
      const runId = runData.id;
      console.log("Run created:", runId);
      
      // Poll for completion
      console.log("Polling for completion...");
      let runStatus = null;
      let attempts = 0;
      const maxAttempts = 60; // 30 seconds max wait time with 500ms intervals
      
      while (attempts < maxAttempts) {
        const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
          headers: {
            "Authorization": `Bearer ${openAIApiKey}`,
            "Content-Type": "application/json",
            "OpenAI-Beta": "assistants=v1"
          }
        });
        
        if (!statusResponse.ok) {
          const errorData = await statusResponse.json();
          throw new Error(`OpenAI status check failed: ${JSON.stringify(errorData)}`);
        }
        
        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        console.log("Run status:", runStatus);
        
        if (runStatus === "completed") {
          break;
        } else if (runStatus === "failed" || runStatus === "cancelled" || runStatus === "expired") {
          throw new Error(`Run ended with status: ${runStatus}`);
        }
        
        // Wait for 500ms before checking again
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (runStatus !== "completed") {
        throw new Error("Assistant run timed out");
      }
      
      // Retrieve messages
      console.log("Retrieving messages...");
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          "Authorization": `Bearer ${openAIApiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v1"
        }
      });
      
      if (!messagesResponse.ok) {
        const errorData = await messagesResponse.json();
        throw new Error(`OpenAI messages retrieval failed: ${JSON.stringify(errorData)}`);
      }
      
      const messagesData = await messagesResponse.json();
      
      // Get the most recent assistant message
      const assistantMessages = messagesData.data.filter(msg => msg.role === "assistant");
      if (assistantMessages.length === 0) {
        throw new Error("No assistant messages found");
      }
      
      const latestMessage = assistantMessages[0];
      const messageContent = latestMessage.content[0].text.value;
      
      // Process message to extract any suggestion
      // Look for content between ```
      const suggestionMatch = messageContent.match(/```([\s\S]*?)```/);
      const suggestion = suggestionMatch ? suggestionMatch[1].trim() : null;
      
      // Clean the message content if it contains a suggestion
      let cleanMessage = messageContent;
      if (suggestion) {
        cleanMessage = messageContent.replace(/```[\s\S]*?```/g, '').trim();
      }
      
      // Store the conversation in the database for context retention
      if (analysisId) {
        try {
          await supabase
            .from('ai_chat_messages')
            .insert([
              {
                analysis_id: analysisId,
                role: 'user',
                content: message,
                section: currentSection
              },
              {
                analysis_id: analysisId,
                role: 'assistant',
                content: cleanMessage,
                suggestion: suggestion,
                section: currentSection
              }
            ]);
        } catch (error) {
          console.error('Error storing chat messages:', error);
          // Continue even if storage fails
        }
      }
      
      return new Response(JSON.stringify({ 
        message: cleanMessage,
        suggestion
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } catch (openAIError) {
      console.error('OpenAI API error:', openAIError);
      throw new Error(`OpenAI API error: ${openAIError.message}`);
    }

  } catch (error) {
    console.error('Error in resume-ai-assistant function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Simple implementation of Supabase client
const createClient = (supabaseUrl: string, supabaseKey: string) => {
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: any) => ({
          single: () => fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}&${column}=eq.${value}`, {
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`
            }
          }).then(res => res.json().then(data => ({ data: data[0], error: null })))
        })
      }),
      insert: (rows: any[]) => 
        fetch(`${supabaseUrl}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(rows)
        }).then(res => {
          if (!res.ok) {
            return res.json().then(data => ({ data: null, error: data }));
          }
          return { data: true, error: null };
        })
    })
  };
};
