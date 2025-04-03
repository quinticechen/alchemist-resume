
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, ChevronDown, User, Bot, Zap, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AIChatInterfaceProps {
  resumeId: string;
  analysisId: string;
  onSuggestionApply: (text: string, sectionId: string) => void;
  currentSectionId: string;
  currentSectionContent?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
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

  // Load existing chat messages and thread metadata on component mount or when analysisId changes
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        // Load messages
        const { data, error } = await supabase
          .from('ai_chat_messages')
          .select('*')
          .eq('analysis_id', analysisId)
          .order('timestamp', { ascending: true });

        if (error) throw error;
        
        if (data && data.length > 0) {
          // Find the most recent thread ID
          const recentThreadId = data
            .filter(msg => msg.thread_id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.thread_id;
            
          if (recentThreadId) {
            setCurrentThreadId(recentThreadId);
            
            // Load thread metadata if we have a thread ID
            const { data: metadataData, error: metadataError } = await supabase
              .from('ai_chat_metadata')
              .select('*')
              .eq('thread_id', recentThreadId)
              .eq('analysis_id', analysisId)
              .single();
              
            if (!metadataError && metadataData) {
              setThreadMetadata({
                thread_id: metadataData.thread_id,
                assistant_id: metadataData.assistant_id,
                run_id: metadataData.run_id
              });
              console.log(`Loaded thread metadata: ${JSON.stringify(metadataData)}`);
            }
          }
          
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
    
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      section: currentSectionId,
      thread_id: currentThreadId || undefined
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
          history: messages.map(msg => ({ role: msg.role, content: msg.content })),
          threadId: currentThreadId // Pass current thread ID if it exists
        }
      });

      if (error) throw error;

      // Process the AI response
      let suggestion = null;
      let content = data.message;
      let threadId = data.threadId;
      let assistantId = data.assistantId;
      let runId = data.runId;
      
      // Update metadata if we have thread information
      if (threadId) {
        setCurrentThreadId(threadId);
        
        if (assistantId && runId) {
          setThreadMetadata({
            thread_id: threadId,
            assistant_id: assistantId,
            run_id: runId
          });
          
          // Save thread metadata to database if it's new
          if (threadId !== currentThreadId) {
            try {
              const { error: metadataError } = await supabase
                .from('ai_chat_metadata')
                .insert({
                  analysis_id: analysisId,
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
        suggestion: suggestion,
        thread_id: threadId
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

  const handleOptimizeCurrentSection = () => {
    if (!currentSectionContent) {
      toast({
        title: "No content to optimize",
        description: "Please select a section with content first.",
        variant: "destructive"
      });
      return;
    }
    
    // Set a prompt to optimize the current section
    const optimizePrompt = `Please optimize this resume section to make it more professional and impactful: "${currentSectionContent}"`;
    setInput(optimizePrompt);
    
    // Focus the textarea
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  const openThreadInGPT = () => {
    if (currentThreadId) {
      window.open(`https://platform.openai.com/playground/threads/${currentThreadId}`, '_blank');
    } else {
      toast({
        title: "No active thread",
        description: "There is no active conversation thread to view.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="relative rounded-xl bg-white shadow-apple h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">AI Resume Assistant</h3>
        <div className="flex items-center gap-2">
          {currentThreadId && (
            <Button
              variant="outline"
              size="sm"
              onClick={openThreadInGPT}
              title="View in OpenAI"
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">OpenAI</span>
            </Button>
          )}
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
                        {message.thread_id && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Thread: {message.thread_id.substring(0, 8)}...
                          </div>
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
              <div className="flex flex-col text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <span>Thread ID:</span>
                  <a 
                    href={`https://platform.openai.com/playground/threads/${threadMetadata.thread_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                    title="View in OpenAI"
                  >
                    {threadMetadata.thread_id.substring(0, 12)}...
                  </a>
                </div>
                <div>Assistant ID: {threadMetadata.assistant_id.substring(0, 8)}...</div>
                <div>Run ID: {threadMetadata.run_id.substring(0, 8)}...</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AIChatInterface;
