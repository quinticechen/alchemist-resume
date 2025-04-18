
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OozeAnimation from "@/components/OozeAnimation"; // Changed from SeekerAnimation to OozeAnimation
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, AlertCircle, Send, User, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface SeekerOptimizationSectionProps {
  optimizationData: any;
  analysisId?: string;
}

const SeekerOptimizationSection = ({ optimizationData, analysisId }: SeekerOptimizationSectionProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [initializationStatus, setInitializationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Add initial welcome message when component mounts
    if (messages.length === 0) {
      setMessages([
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Watch this! Behold the secrets of alchemy! Bang! A dazzling resume has just come out of the oven! Are you shocked to see your own transformation?',
          timestamp: new Date()
        }
      ]);
    }
  }, [messages.length]);

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
        
        // Get message history
        const { data: chatData, error } = await supabase
          .from('ai_chat_messages')
          .select('*')
          .eq('analysis_id', analysisId)
          .order('timestamp', { ascending: true });
          
        if (error) throw error;
        
        if (chatData && chatData.length > 0) {
          // Filter out system messages for display
          const displayMessages = chatData
            .filter(msg => msg.role !== 'system')
            .map(msg => ({
              id: msg.id,
              role: msg.role as 'user' | 'assistant' | 'system',
              content: msg.content,
              timestamp: new Date(msg.timestamp)
            }));
          
          setMessages(displayMessages);
          console.log(`Loaded ${displayMessages.length} messages for analysis: ${analysisId}`);
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

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        threadId: threadId
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

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data?.message || "Sorry, I couldn't generate a response.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      await saveChatMessage(aiMessage);
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

  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <OozeAnimation width={18} height={18} /> {/* Changed to OozeAnimation */}
          Resume Optimization Assistant {/* Changed from "Seeker Optimization Assistant" to match the character */}
          {initializationStatus === 'error' && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={handleRetryInitialization}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 overflow-hidden p-4">
        {debugInfo ? (
          <div className="flex-1 overflow-auto bg-slate-100 p-4 rounded text-xs font-mono">
            <pre>{debugInfo}</pre>
          </div>
        ) : initializationStatus === 'loading' ? (
          <div className="flex flex-col items-center justify-center h-full">
            <OozeAnimation width={120} height={120} /> {/* Changed to OozeAnimation */}
            <p className="text-sm text-muted-foreground mt-4">Loading assistant...</p>
          </div>
        ) : initializationStatus === 'error' ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Connection Error</h3>
            <p className="text-center text-muted-foreground mb-4">
              Could not connect to the AI assistant. 
              Please check your connection and try again.
            </p>
            <Button onClick={handleRetryInitialization}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <OozeAnimation width={120} height={120} /> {/* Changed to OozeAnimation */}
            </div>
            
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`rounded-lg p-3 max-w-[85%] ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex gap-2">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.role === 'user' && <User className="h-5 w-5 flex-shrink-0" />}
                      </div>
                    </div>
                  </div>
                ))}
                
                {!analysisId && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">Analysis ID not found. Some features may be limited.</p>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </>
        )}
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for resume optimization suggestions..."
              className="resize-none"
              disabled={isLoading || !analysisId || initializationStatus !== 'success'}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || input.trim() === '' || !analysisId || initializationStatus !== 'success'}
              size="icon"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          {isLoading && <p className="text-sm text-muted-foreground mt-2">AI is thinking...</p>}
          {threadId && (
            <p className="text-xs text-muted-foreground mt-2">Thread ID: {threadId.substring(0, 8)}...</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SeekerOptimizationSection;
