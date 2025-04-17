
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import JellyfishAnimation from "@/components/JellyfishAnimation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, AlertCircle, Send, Bot, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Add initial welcome message when component mounts
    if (messages.length === 0) {
      setMessages([
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Hello! I can help optimize your resume. What would you like help with?',
          timestamp: new Date()
        }
      ]);
    }
  }, [messages.length]);

  useEffect(() => {
    // Load existing chat history if we have an analysis ID
    const loadChatHistory = async () => {
      if (!analysisId) return;
      
      try {
        // Try to get thread ID first
        const { data: metadataData } = await supabase
          .from('ai_chat_metadata')
          .select('thread_id')
          .eq('analysis_id', analysisId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (metadataData && metadataData.length > 0) {
          setThreadId(metadataData[0].thread_id);
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
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: new Date(msg.timestamp)
            }));
          
          setMessages(displayMessages);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };
    
    loadChatHistory();
  }, [analysisId]);

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
    
    await saveChatMessage(userMessage);

    try {
      const { data, error } = await supabase.functions.invoke('resume-ai-assistant', {
        body: { 
          message: input, 
          analysisId: analysisId,
          threadId: threadId
        }
      });

      if (error) {
        throw error;
      }

      if (data?.threadId) {
        setThreadId(data.threadId);
      }

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data?.message || "Sorry, I couldn't generate a response.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      await saveChatMessage(aiMessage);
    } catch (error) {
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

  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot size={18} />
          Seeker Optimization Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 overflow-hidden p-4">
        <div className="flex justify-center mb-4">
          <JellyfishAnimation width={120} height={120} />
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
                    {message.role === 'assistant' && <Bot className="h-5 w-5 flex-shrink-0" />}
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
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for resume optimization suggestions..."
              className="resize-none"
              disabled={isLoading || !analysisId}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || input.trim() === '' || !analysisId}
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
