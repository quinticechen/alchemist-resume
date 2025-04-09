
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, ChevronDown, User, Bot, Zap, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLocation, useParams } from "react-router-dom";

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
  const params = useParams();
  const [effectiveAnalysisId, setEffectiveAnalysisId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const dialogDescriptionId = "aiChatInterfaceDescription";

  // Extract analysis ID with improved robustness
  useEffect(() => {
    const extractAnalysisId = () => {
      // First priority: Check URL parameters
      if (params.analysisId) {
        console.log(`Found analysis ID in URL params: ${params.analysisId}`);
        return params.analysisId;
      }
      
      // Second priority: use prop if available and valid
      if (analysisId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(analysisId)) {
        console.log(`Using provided analysisId prop: ${analysisId}`);
        return analysisId;
      }
      
      // Third: check URL path segments
      const pathSegments = location.pathname.split('/');
      const potentialIds = pathSegments.filter(segment => 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
      );
      
      if (potentialIds.length > 0) {
        console.log(`Extracted analysisId from URL path: ${potentialIds[0]}`);
        return potentialIds[0];
      }
      
      // Fourth: check location state
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
  }, [analysisId, location, params]);

  useEffect(() => {
    const loadChatHistory = async () => {
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
          console.log(`Loaded ${displayMessages.length} messages for analysis: ${effectiveAnalysisId}`);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        console.log("Stored system message in database");
      }
      
      if (threadId) {
        setCurrentThreadId(threadId);
        console.log(`Using OpenAI thread ID: ${threadId}`);
        
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
              console.log(`Stored new thread metadata: ${threadId}`);
            } catch (metadataErr) {
              console.error('Error saving thread metadata:', metadataErr);
            }
          }
        }
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
            disabled={!effectiveAnalysisId}
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
              
              {apiError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <p>{apiError}</p>
                </div>
              )}
              
              {!effectiveAnalysisId && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                  <p className="font-medium">Unable to find resume analysis ID</p>
                  <p className="text-sm mt-1">Please ensure you're accessing this page correctly from your resume list.</p>
                </div>
              )}
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
                disabled={isLoading || !effectiveAnalysisId}
                aria-describedby={dialogDescriptionId}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || input.trim() === '' || !effectiveAnalysisId}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {isLoading && <p className="text-sm text-muted-foreground mt-2">AI is thinking...</p>}
            {effectiveAnalysisId && (
              <div className="text-xs text-muted-foreground mt-2">
                <div>Analysis ID: {effectiveAnalysisId.substring(0, 8)}...</div>
                {threadMetadata && <div>Thread ID: {threadMetadata.thread_id.substring(0, 12)}...</div>}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AIChatInterface;
