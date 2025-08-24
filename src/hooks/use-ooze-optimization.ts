
import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/components/alchemy-records/chat/types';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const resumeAlchemistMessages = [
  "aiChat.greeting",
  "aiChat.welcomeMessage1",
  "aiChat.welcomeMessage2"
];

export const useOozeOptimization = (analysisId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [initializationStatus, setInitializationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [guidanceForOptimization, setGuidanceForOptimization] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Load existing chat history if we have an analysis ID
    const loadChatHistory = async () => {
      if (!analysisId) {
        setInitializationStatus('error');
        return;
      }
      
      try {
        setInitializationStatus('loading');
        console.log(`Loading chat history for analysis ID: ${analysisId}`);
        
        // Try to get thread ID first
        const { data: metadataData } = await supabase
          .from('ai_chat_metadata')
          .select('thread_id')
          .eq('analysis_id', analysisId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (metadataData && metadataData.length > 0) {
          setThreadId(metadataData[0].thread_id);
          console.log(`Retrieved thread ID: ${metadataData[0].thread_id}`);
        }
        
        // Get message history - filter out system messages for display
        const { data: chatData, error } = await supabase
          .from('ai_chat_messages')
          .select('*')
          .eq('analysis_id', analysisId)
          .neq('role', 'system') // Explicitly exclude system messages from display
          .order('timestamp', { ascending: true });
          
        if (error) throw error;
        
        // Get editor content for optimization guidance
        const { data: editorData } = await supabase
          .from('resume_editors')
          .select('content')
          .eq('analysis_id', analysisId)
          .single();
          
        if (editorData?.content?.guidanceForOptimization) {
          setGuidanceForOptimization(editorData.content.guidanceForOptimization);
        }
        
        if (chatData && chatData.length > 0) {
          // Process messages for display (excluding system messages)
          const displayMessages = chatData
            .filter(msg => msg.role !== 'system') // Double-check to filter out system messages
            .map(msg => ({
              id: msg.id,
              role: msg.role as 'user' | 'assistant' | 'system',
              content: msg.content,
              timestamp: new Date(msg.timestamp)
            }));
          
          setMessages(displayMessages);
          console.log(`Loaded ${displayMessages.length} messages for display from ${chatData.length} total messages for analysis: ${analysisId}`);
        } else {
          // Add welcome message if no messages exist
          const randomIndex = Math.floor(Math.random() * resumeAlchemistMessages.length);
          const welcomeMessage = {
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: resumeAlchemistMessages[randomIndex],
            timestamp: new Date()
          };
          
          setMessages([welcomeMessage]);
          await saveChatMessage(welcomeMessage);
        }
        
        setInitializationStatus('success');
      } catch (error) {
        console.error('Error loading chat history:', error);
        setInitializationStatus('error');
        toast({
          title: "Error",
          description: "Failed to load chat history. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    loadChatHistory();
  }, [analysisId, toast]);

  const saveChatMessage = async (message: ChatMessage) => {
    if (!analysisId) return;
    
    try {
      const { error } = await supabase
        .from('ai_chat_messages')
        .insert({
          id: message.id,
          role: message.role,
          content: message.content,
          timestamp: message.timestamp.toISOString(),
          analysis_id: analysisId,
          thread_id: threadId
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '' || !analysisId) return;
    
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setDebugInfo(null);
    
    try {
      console.log(`Sending message to edge function with analysisId: ${analysisId}, threadId: ${threadId || 'new'}`);
      
      // Enhanced edge function call with more detailed request logging
      const startTime = new Date().getTime();
      const requestPayload = { 
        message: input, 
        analysisId: analysisId,
        threadId: threadId,
        clientMessageId: userMessage.id // Send client message ID to prevent duplicate storage
      };
      
      console.log('Request payload:', JSON.stringify(requestPayload));
      
      const { data, error } = await supabase.functions.invoke('resume-ai-assistant', {
        body: requestPayload
      });

      const endTime = new Date().getTime();
      console.log(`Edge function response time: ${endTime - startTime}ms`);

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Edge function response:', data);
      
      if (!data) {
        throw new Error("Empty response from edge function");
      }

      if (data?.threadId) {
        setThreadId(data.threadId);
        console.log(`Setting thread ID from response: ${data.threadId}`);
      }
      
      if (data?.guidanceForOptimization) {
        setGuidanceForOptimization(data.guidanceForOptimization);
      }

      // Use the server-provided message ID if available, otherwise generate a new one
      const aiMessageId = data?.messageId || crypto.randomUUID();
      
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        role: 'assistant',
        content: data?.message || "Sorry, I couldn't generate a response.",
        timestamp: new Date()
      };

      // Add to UI but don't save to database - the server already did that
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      await saveChatMessage(errorMessage);
      
      toast({
        title: "Error",
        description: `Failed to get AI response: ${error.message}`,
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

  const handleRetryInitialization = () => {
    setInitializationStatus('idle');
    // This will trigger the useEffect to reload chat history
  };

  const handlePromptSelect = (promptText: string) => {
    setInput(promptText);
  };
  
  return {
    messages,
    input,
    isLoading,
    threadId,
    debugInfo,
    initializationStatus,
    messagesEndRef,
    setInput,
    handleSendMessage,
    handleKeyDown,
    handleRetryInitialization,
    handlePromptSelect
  };
};
