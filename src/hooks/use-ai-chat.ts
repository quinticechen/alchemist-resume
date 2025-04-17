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
        return params.analysisId;
      }
      
      // If explicitly provided
      if (providedAnalysisId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providedAnalysisId)) {
        return providedAnalysisId;
      }
      
      // Check URL path segments
      const pathSegments = location.pathname.split('/');
      const potentialIds = pathSegments.filter(segment => 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
      );
      
      if (potentialIds.length > 0) {
        return potentialIds[0];
      }
      
      // Check location state
      if (location.state && location.state.analysisId) {
        return location.state.analysisId;
      }
      
      return null;
    };
    
    const id = extractAnalysisId();
    setEffectiveAnalysisId(id);
    
    // Reset API error when analysis ID changes
    setApiError(null);
  }, [location, params, providedAnalysisId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history when analysis ID is available
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!effectiveAnalysisId) {
        return;
      }

      try {
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
          
          // Mark that we've already sent resume content since this is an existing thread
          setResumeContentSent(true);
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
          
          // If we have messages but no threadId from metadata, try to extract from messages
          if (!threadId && displayMessages.length > 0 && displayMessages[0].thread_id) {
            threadId = displayMessages[0].thread_id;
            setCurrentThreadId(threadId);
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

  const saveChatMessage = async (message: ChatMessage, threadId?: string | null, analysisId?: string | null) => {
    const targetAnalysisId = analysisId || effectiveAnalysisId;
    if (!targetAnalysisId) return;
    
    try {
      const { error } = await supabase
        .from('ai_chat_messages')
        .insert({
          id: message.id,
          role: message.role,
          content: message.content, 
          timestamp: message.timestamp.toISOString(),
          analysis_id: targetAnalysisId,
          thread_id: threadId || currentThreadId
        });

      if (error) {
        console.error('Error saving chat message:', error);
      }
    } catch (error) {
      console.error('Exception in saveChatMessage:', error);
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
    if (!input.trim()) {
      return;
    }
    
    if (!effectiveAnalysisId) {
      toast({
        title: "Error",
        description: "Unable to identify the current resume analysis. Try refreshing the page.",
        variant: "destructive" 
      });
      return;
    }
    
    setApiError(null);
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Save the message
    await saveChatMessage(userMessage);
    
    // Clear input
    setInput('');
    
    // Send to AI assistant
    await sendToAIAssistant(userMessage.content);
  };

  const sendToAIAssistant = async (message: string) => {
    if (!effectiveAnalysisId) {
      toast({
        title: "Error",
        description: "Unable to identify the current resume analysis. Try refreshing the page.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Check if we need to get resume content for the first message
      let resumeContent = null;
      if (!resumeContentSent) {
        resumeContent = await fetchResumeContent();
        setResumeContentSent(true);
      }
      
      const { data, error } = await supabase.functions.invoke('resume-ai-assistant', {
        body: { 
          message,
          analysisId: effectiveAnalysisId,
          currentSection: currentSectionId,
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
      let systemPrompt = data.systemPrompt;
      
      if (threadId) {
        setCurrentThreadId(threadId);
      }
      
      if (data.suggestion) {
        suggestion = data.suggestion;
      }
      
      if (systemPrompt) {
        const hasSystemPrompt = messages.some(msg => 
          msg.role === 'system' && msg.thread_id === threadId
        );
        
        if (!hasSystemPrompt) {
          await saveChatMessage({
            id: crypto.randomUUID(),
            role: 'system',
            content: systemPrompt,
            timestamp: new Date()
          }, threadId, effectiveAnalysisId);
        }
      }
      
      // Add AI response to chat
      const aiMessage = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: content,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Save the message to the database
      await saveChatMessage(aiMessage, threadId, effectiveAnalysisId);
      
      // Update metadata if needed
      if (threadId) {
        try {
          const { error: metadataError } = await supabase
            .from('ai_chat_metadata')
            .upsert({
              analysis_id: effectiveAnalysisId,
              thread_id: threadId,
              updated_at: new Date().toISOString()
            });
            
          if (metadataError) {
            console.error('Error updating chat metadata:', metadataError);
          }
        } catch (error) {
          console.error('Error in metadata refresh:', error);
        }
      }
      
      setApiError(null);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      setApiError(`Failed to connect to AI service. Please try again.`);
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again later.",
        timestamp: new Date()
      }]);
      
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
