
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, ChevronDown, User, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AIChatInterfaceProps {
  resumeId: string;
  analysisId: string;
  onSuggestionApply: (text: string, sectionId: string) => void;
  currentSectionId: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  section?: string;
  suggestion?: string;
}

const AIChatInterface: React.FC<AIChatInterfaceProps> = ({ 
  resumeId, 
  analysisId,
  onSuggestionApply,
  currentSectionId
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showChat, setShowChat] = useState(true);

  // Load existing chat messages on component mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_chat_messages')
          .select('*')
          .eq('analysis_id', analysisId)
          .order('timestamp', { ascending: true });

        if (error) throw error;
        
        if (data && data.length > 0) {
          setMessages(data.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
        } else {
          // Add a welcome message if no chat history exists
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

    if (analysisId) {
      loadChatHistory();
    }
  }, [analysisId]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveChatMessage = async (message: ChatMessage) => {
    try {
      const { error } = await supabase
        .from('ai_chat_messages')
        .insert({
          id: message.id,
          role: message.role,
          content: message.content,
          timestamp: message.timestamp.toISOString(),
          analysis_id: analysisId,
          section: message.section,
          suggestion: message.suggestion
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '') return;
    
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      section: currentSectionId
    };

    // Update UI immediately
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Save user message to database
    await saveChatMessage(userMessage);

    try {
      // Make API call to generate response
      const { data, error } = await supabase.functions.invoke('resume-ai-assistant', {
        body: { 
          message: input, 
          analysisId, 
          resumeId,
          currentSection: currentSectionId,
          history: messages.map(msg => ({ role: msg.role, content: msg.content }))
        }
      });

      if (error) throw error;

      // Process the AI response
      let suggestion = null;
      let content = data.message;

      // Check if the response contains a suggestion
      if (data.suggestion) {
        suggestion = data.suggestion;
        content += "\n\nI've created a suggestion for your resume. You can apply it by clicking the 'Apply' button.";
      }

      // Create AI message
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: content,
        timestamp: new Date(),
        section: currentSectionId,
        suggestion: suggestion
      };

      // Update UI with AI response
      setMessages(prev => [...prev, aiMessage]);
      
      // Save AI message to database
      await saveChatMessage(aiMessage);
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Add error message
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
    onSuggestionApply(suggestion, section);
    toast({
      title: "Suggestion applied",
      description: "The suggestion has been applied to your resume."
    });
  };

  return (
    <div className="relative rounded-xl bg-white shadow-apple h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">AI Resume Assistant</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowChat(!showChat)}
          aria-label={showChat ? "Collapse chat" : "Expand chat"}
        >
          <ChevronDown className={`h-5 w-5 transition-transform ${showChat ? '' : 'transform rotate-180'}`} />
        </Button>
      </div>
      
      {showChat && (
        <>
          <ScrollArea className="p-4 h-[400px]">
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card 
                    className={`p-3 max-w-[80%] ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.role === 'assistant' && <Bot className="h-5 w-5 mt-1 flex-shrink-0" />}
                      <div>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        {message.suggestion && (
                          <Button 
                            className="mt-2" 
                            size="sm"
                            onClick={() => handleApplySuggestion(message.suggestion!, message.section!)}
                          >
                            Apply Suggestion
                          </Button>
                        )}
                      </div>
                      {message.role === 'user' && <User className="h-5 w-5 mt-1 flex-shrink-0" />}
                    </div>
                  </Card>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask for advice on your resume..."
                className="resize-none"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || input.trim() === ''}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {isLoading && <p className="text-sm text-muted-foreground mt-2">AI is thinking...</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default AIChatInterface;
