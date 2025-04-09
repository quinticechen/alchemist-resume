import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, ChevronDown, User, Bot, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

interface AIChatInterfaceProps {
  resumeId: string;
  analysisId: string;
  onSuggestionApply: (text: string, sectionId: string) => void;
  currentSectionId: string;
  currentSectionContent?: string;
}

interface ChatMessage {
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

const AIChatInterface: React.FC<AIChatInterfaceProps> = ({ 
  resumeId, 
  analysisId,
  onSuggestionApply,
  currentSectionId,
  currentSectionContent
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showChat, setShowChat] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [threadMetadata, setThreadMetadata] = useState<ThreadMetadata | null>(null);
  const location = useLocation();
  const dialogDescriptionId = "aiChatInterfaceDescription";

  const getAnalysisIdFromUrl = () => {
    const pathSegments = location.pathname.split('/');
    const urlAnalysisId = pathSegments[pathSegments.length - 1];
    if (urlAnalysisId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(urlAnalysisId)) {
      console.log(`Extracted backup analysisId from URL: ${urlAnalysisId}`);
      return urlAnalysisId;
    }
    return null;
  };

  const getEffectiveAnalysisId = () => {
    if (analysisId) return analysisId;
    const urlAnalysisId = getAnalysisIdFromUrl();
    if (urlAnalysisId) {
      console.log(`Using URL-extracted analysisId: ${urlAnalysisId} because props.analysisId is not available`);
      return urlAnalysisId;
    }
    return null;
  };

  useEffect(() => {
    const loadChatHistory = async () => {
      const effectiveAnalysisId = getEffectiveAnalysisId();
      
      if (!effectiveAnalysisId) {
        console.error("Missing analysisId for chat history load");
        return;
      }

      try {
        console.log(`Loading chat history for analysis: ${effectiveAnalysisId}`);
        
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
          console.log(`Using existing thread: ${threadId}`);
        }
        
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

    if (getEffectiveAnalysisId()) {
      loadChatHistory();
    } else {
      console.warn("No analysisId provided or found in URL for AIChatInterface");
    }
  }, [analysisId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveChatMessage = async (message: ChatMessage) => {
    try {
      const effectiveAnalysisId = getEffectiveAnalysisId();
      
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
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '') return;
    
    const effectiveAnalysisId = getEffectiveAnalysisId();
    
    if (!effectiveAnalysisId) {
      toast({
        title: "Error",
        description: "Cannot send message: Missing analysis ID",
        variant: "destructive"
      });
      return;
    }
    
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
      
      const { data, error } = await supabase.functions.invoke('resume-ai-assistant', {
        body: { 
          message: input, 
          analysisId: effectiveAnalysisId, 
          resumeId,
          currentSection: currentSectionId,
          history: messages.map(msg => ({ role: msg.role, content: msg.content })),
          threadId: currentThreadId
        }
      });

      if (error) throw error;

      let suggestion = null;
      let content = data.message;
      let threadId = data.threadId;
      let assistantId = data.assistantId;
      let runId = data.runId;
      let systemPrompt = data.systemPrompt;
      
      if (systemPrompt) {
        const systemMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'system',
          content: systemPrompt,
          timestamp: new Date(),
          section: currentSectionId,
          thread_id: threadId
        };
        
        await saveChatMessage(systemMessage);
      }
      
      if (threadId) {
        setCurrentThreadId(threadId);
        
        if (assistantId && runId) {
          setThreadMetadata({
            thread_id: threadId,
            assistant_id: assistantId,
            run_id: runId
          });
          
          if (threadId !== currentThreadId) {
            try {
              const { error: metadataError } = await supabase
                .from('ai_chat_metadata')
                .insert({
                  analysis_id: effectiveAnalysisId,
                  thread_id: threadId,
                  assistant_id: assistantId,
                  run_id: runId,
                  section: currentSectionId
                });
                
              if (metadataError) throw metadataError;
            } catch (metadataErr) {
              console.error('Error saving thread metadata:', metadataErr);
            }
          }
        }
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
      
      await saveChatMessage(aiMessage);
    } catch (error) {
      console.error('Error getting AI response:', error);
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
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative rounded-xl bg-white shadow-apple h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">AI Resume Assistant</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOptimizeCurrentSection}
            title="Optimize current section"
            className="flex items-center gap-1"
          >
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Optimize</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowChat(!showChat)}
            aria-label={showChat ? "Collapse chat" : "Expand chat"}
          >
            <ChevronDown className={`h-5 w-5 transition-transform ${showChat ? '' : 'transform rotate-180'}`} />
          </Button>
        </div>
      </div>
      
      {showChat && (
        <>
          <ScrollArea className="p-4 h-[400px]">
            <div className="space-y-4" id={dialogDescriptionId}>
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
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask for advice on your resume..."
                className="resize-none"
                disabled={isLoading}
                aria-describedby={dialogDescriptionId}
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
            {threadMetadata && (
              <div className="text-xs text-muted-foreground mt-2">
                <div>Thread ID: {threadMetadata.thread_id.substring(0, 12)}...</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AIChatInterface;
