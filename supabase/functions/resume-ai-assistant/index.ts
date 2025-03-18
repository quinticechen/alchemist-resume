
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { message, analysisId, resumeId, currentSection, history } = await req.json();
    
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

    let sections = [];
    try {
      sections = JSON.parse(resumeData.content);
    } catch (error) {
      throw new Error(`Error parsing resume data: ${error.message}`);
    }

    // Get current section content
    const currentSectionContent = sections.find(
      (section: any) => section.id === currentSection
    );

    // Prepare the system prompt
    const systemPrompt = `You are an expert resume assistant helping a user improve their resume.
    
Your goal is to provide actionable advice to make their resume more effective and professional.

Here's the current content of the resume section they're working on:
Section: ${currentSectionContent?.title || 'Unknown'}
Content:
${currentSectionContent?.content || 'No content available'}

When asked to make specific improvements:
1. Give clear, specific advice on how to improve the section
2. If appropriate, provide a complete rewritten version that they can directly apply
3. Focus on professional achievements, clear language, and impactful descriptions
4. Always maintain the user's industry focus and experience level

Respond in a helpful, supportive tone. When providing a suggestion that can be directly applied, clearly indicate it.`;

    // Build message history for context
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10), // Include only the last 10 messages for context
      { role: "user", content: message }
    ];

    // Make request to OpenAI
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const openAIData = await openAIResponse.json();
    
    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${JSON.stringify(openAIData)}`);
    }

    const aiMessage = openAIData.choices[0].message.content;
    
    // Check if the response contains a suggestion (text between triple backticks)
    const suggestionMatch = aiMessage.match(/```([\s\S]*?)```/);
    const suggestion = suggestionMatch ? suggestionMatch[1].trim() : null;
    
    // Clean the message if it contains a suggestion
    let cleanMessage = aiMessage;
    if (suggestion) {
      cleanMessage = aiMessage.replace(/```[\s\S]*?```/g, '').trim();
    }

    return new Response(JSON.stringify({ 
      message: cleanMessage,
      suggestion
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
      })
    })
  };
};
