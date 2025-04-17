
import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "react-router-dom";

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  section?: string;
  suggestion?: string;
  thread_id?: string;
}

interface ThreadMetadata {
  thread_id: string;
  assistant_id: string;
  run_id: string;
}

export const useAIChat = (
  resumeId?: string, 
  providedAnalysisId?: string,
  currentSectionId?: string,
  currentSectionContent?: string,
  onSuggestionApply?: (text: string, sectionId: string) => void,
) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [threadMetadata, setThreadMetadata] = useState<ThreadMetadata | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();
  const location = useLocation();
  const params = useParams();
  const [effectiveAnalysisId, setEffectiveAnalysisId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastQueryTimestamp, setLastQueryTimestamp] = useState<number>(0);
  const [resumeContentSent, setResumeContentSent] = useState<boolean>(false);

  // Extract analysis ID with improved robustness
  useEffect(() => {
    const extractAnalysisId = () => {
      // First priority: Check URL parameters
      if (params.analysisId) {
        console.log(`Found analysis ID in URL params: ${params.analysisId}`);
        return params.analysisId;
      }
      
      // If explicitly provided
      if (providedAnalysisId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providedAnalysisId)) {
        console.log(`Using provided analysisId prop: ${providedAnalysisId}`);
        return providedAnalysisId;
      }
      
      // Check URL path segments
      const pathSegments = location.pathname.split('/');
      const potentialIds = pathSegments.filter(segment => 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
      );
      
      if (potentialIds.length > 0) {
        console.log(`Extracted analysisId from URL path: ${potentialIds[0]}`);
        return potentialIds[0];
      }
      
      // Check location state
      if (location.state && location.state.analysisId) {
        console.log(`Found analysisId in location state: ${location.state.analysisId}`);
        return location.state.analysisId;
      }
      
      console.warn("Could not determine analysis ID from props, URL, or state");
      return null;
    };
    
    const id = extractAnalysisId();
    setEffectiveAnalysisId(id);
    console.log(`AIChatInterface initialized with effective analysis ID: ${id || "none"}`);
    
    // Reset API error when analysis ID changes
    setApiError(null);
  }, [providedAnalysisId, location, params]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history when analysis ID is available
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!effectiveAnalysisId) {
        console.error("Missing analysisId for chat history load");
        return;
      }

      try {
        console.log(`Loading chat history for analysis: ${effectiveAnalysisId}`);
        setLastQueryTimestamp(Date.now());
        
        // Query metadata first to get thread information
        const { data: metadataData, error: metadataError } = await supabase
          .from('ai_chat_metadata')
          .select('*')
          .eq('analysis_id', effectiveAnalysisId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        let threadId = null;
        
        if (!metadataError && metadataData && metadataData.length > 0) {
          threadId = metadataData[0].thread_id;
          setCurrentThreadId(threadId);
          setThreadMetadata({
            thread_id: metadataData[0].thread_id,
            assistant_id: metadataData[0].assistant_id,
            run_id: metadataData[0].run_id
          });
          console.log(`Found existing metadata for analysis ${effectiveAnalysisId}, thread: ${threadId}`);
          
          // Mark that we've already sent resume content since this is an existing thread
          setResumeContentSent(true);
        } else {
          console.log(`No existing metadata found for analysis ${effectiveAnalysisId}`);
        }
        
        // Now query for messages
        const { data, error } = await supabase
          .from('ai_chat_messages')
          .select('*')
          .eq('analysis_id', effectiveAnalysisId)
          .order('timestamp', { ascending: true });

        if (error) throw error;
        
        if (data && data.length > 0) {
          const displayMessages = data
            .filter(msg => msg.role !== 'system')
            .map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
          
          setMessages(displayMessages);
          console.log(`Loaded ${displayMessages.length} messages for analysis: ${effectiveAnalysisId}`);
          
          // If we have messages but no threadId from metadata, try to extract from messages
          if (!threadId && displayMessages.length > 0 && displayMessages[0].thread_id) {
            threadId = displayMessages[0].thread_id;
            setCurrentThreadId(threadId);
            console.log(`Extracted thread ID from message: ${threadId}`);
          }
        } else {
          const welcomeMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Hello! I can help you improve your resume. What section would you like assistance with?',
            timestamp: new Date(),
          };
          
          await saveChatMessage(welcomeMessage);
          setMessages([welcomeMessage]);
          console.log("No existing messages, created welcome message");
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        toast({
          title: "Error loading chat history",
          description: "We couldn't load your previous messages.",
          variant: "destructive"
        });
      }
    };

    if (effectiveAnalysisId) {
      loadChatHistory();
    } else {
      console.warn("No analysisId available for AIChatInterface");
    }
  }, [effectiveAnalysisId]);

  const saveChatMessage = async (message: ChatMessage) => {
    try {
      if (!effectiveAnalysisId) {
        console.error("Cannot save chat message: Missing analysisId");
        return;
      }

      const { error } = await supabase
        .from('ai_chat_messages')
        .insert({
          id: message.id,
          role: message.role,
          content: message.content,
          timestamp: message.timestamp.toISOString(),
          analysis_id: effectiveAnalysisId,
          section: message.section,
          suggestion: message.suggestion,
          thread_id: message.thread_id
        });

      if (error) throw error;
      console.log(`Saved message with ID: ${message.id}`);
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  };

  // Function to fetch resume content from resume_editors
  const fetchResumeContent = async () => {
    if (!effectiveAnalysisId) return null;
    
    try {
      const { data, error } = await supabase
        .from('resume_editors')
        .select('content')
        .eq('analysis_id', effectiveAnalysisId)
        .single();

      if (error) throw error;
      return data?.content ? JSON.stringify(data.content) : null;
    } catch (error) {
      console.error('Error fetching resume content:', error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '') return;
    
    if (!effectiveAnalysisId) {
      toast({
        title: "Error",
        description: "Cannot send message: Missing analysis ID",
        variant: "destructive"
      });
      return;
    }
    
    // Clear any previous API errors
    setApiError(null);
    
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      section: currentSectionId,
      thread_id: currentThreadId || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    await saveChatMessage(userMessage);

    try {
      console.log(`Sending message to resume-ai-assistant for analysis: ${effectiveAnalysisId}`);
      console.log(`Using thread ID: ${currentThreadId || "new thread"}`);
      
      // Check if this is the first message and we need to send resume content
      let resumeContent = null;
      if (!resumeContentSent) {
        resumeContent = await fetchResumeContent();
        setResumeContentSent(true);
        console.log("Sending resume content with first message");
      }
      
      const { data, error } = await supabase.functions.invoke('resume-ai-assistant', {
        body: { 
          message: input, 
          analysisId: effectiveAnalysisId, 
          resumeId,
          currentSection: currentSectionId,
          history: messages.map(msg => ({ role: msg.role, content: msg.content })),
          threadId: currentThreadId,
          resumeContent: resumeContent
        }
      });

      if (error) {
        console.error('Error invoking resume-ai-assistant:', error);
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from resume-ai-assistant");
      }

      let suggestion = null;
      let content = data.message;
      let threadId = data.threadId;
      
      if (threadId) {
        setCurrentThreadId(threadId);
        console.log(`Using thread ID from response: ${threadId}`);
        
        // Refresh metadata after a delay to ensure the edge function had time to save it
        setTimeout(async () => {
          try {
            const { data: refreshedMetadataData } = await supabase
              .from('ai_chat_metadata')
              .select('*')
              .eq('analysis_id', effectiveAnalysisId)
              .eq('thread_id', threadId)
              .maybeSingle();
              
            if (refreshedMetadataData) {
              setThreadMetadata({
                thread_id: refreshedMetadataData.thread_id,
                assistant_id: refreshedMetadataData.assistant_id,
                run_id: refreshedMetadataData.run_id
              });
              console.log(`Refreshed metadata for thread: ${threadId}`);
            } else {
              console.warn(`No metadata found for thread ${threadId} after refresh`);
            }
          } catch (refreshError) {
            console.error('Error refreshing thread metadata:', refreshError);
          }
        }, 1000);
      } else {
        console.warn("No thread ID returned from resume-ai-assistant");
      }

      if (data.suggestion) {
        suggestion = data.suggestion;
        content += "\n\nI've created a suggestion for your resume. You can apply it by clicking the 'Apply' button.";
      }

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: content,
        timestamp: new Date(),
        section: currentSectionId,
        suggestion: suggestion,
        thread_id: threadId
      };

      setMessages(prev => [...prev, aiMessage]);
      console.log("Added AI response to chat");
      
      await saveChatMessage(aiMessage);
      
      // Clear any previous errors
      setApiError(null);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Set API error state
      setApiError("Failed to connect to AI service. Please try again.");
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      await saveChatMessage(errorMessage);
      
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleApplySuggestion = (suggestion: string, section: string) => {
    if (onSuggestionApply) {
      onSuggestionApply(suggestion, section);
      toast({
        title: "Suggestion applied",
        description: "The suggestion has been applied to your resume."
      });
    }
  };

  const handleOptimizeCurrentSection = () => {
    if (!currentSectionContent) {
      toast({
        title: "No content to optimize",
        description: "Please select a section with content first.",
        variant: "destructive"
      });
      return;
    }
    
    const optimizePrompt = `Please optimize this resume section to make it more professional and impactful: "${currentSectionContent}"`;
    setInput(optimizePrompt);
  };

  return {
    messages,
    input,
    isLoading,
    apiError,
    effectiveAnalysisId,
    currentThreadId,
    threadMetadata,
    messagesEndRef,
    setInput,
    handleSendMessage,
    handleKeyDown,
    handleApplySuggestion,
    handleOptimizeCurrentSection
  };
};
