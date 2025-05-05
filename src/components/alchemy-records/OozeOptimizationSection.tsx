
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OozeAnimation from "@/components/OozeAnimation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, AlertCircle, Send, User, Loader2, RefreshCw, Search, MessageSquare, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface OozeOptimizationSectionProps {
  optimizationData: any;
  analysisId?: string;
}

const OozeOptimizationSection = ({ optimizationData, analysisId }: OozeOptimizationSectionProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [initializationStatus, setInitializationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [guidanceForOptimization, setGuidanceForOptimization] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const resumeAlchemistMessages = [
    "Hey there! Your resume is glowing now, but shall we explore what else we can enhance? I've got some magical tricks up my tentacles!",
    "Curious about how I transformed your resume? Let's chat about my secrets and see if we've missed any important points!",
    "My tentacles sense there's still some hidden potential in your resume! Want to explore together!"
  ];

  const promptGuides = [
    { 
      text: "What are the most attractive highlights in this resume?",
      icon: <Lightbulb className="h-4 w-4" />
    },
    { 
      text: "Which keywords could we strengthen?",
      icon: <Search className="h-4 w-4" />
    },
    { 
      text: "How can we make your experience more compelling?", 
      icon: <MessageSquare className="h-4 w-4" />
    },
    { 
      text: "What questions might interviewers ask?", 
      icon: <HelpCircle className="h-4 w-4" />
    }
  ];

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
          .neq('role', 'system') // Exclude system messages from display
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
          // Filter out system messages for display
          const displayMessages = chatData
            .map(msg => ({
              id: msg.id,
              role: msg.role as 'user' | 'assistant' | 'system',
              content: msg.content,
              timestamp: new Date(msg.timestamp)
            }));
          
          setMessages(displayMessages);
          console.log(`Loaded ${displayMessages.length} messages for analysis: ${analysisId}`);
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    const currentInput = input; // 儲存目前的輸入，防止在請求過程中被修改

    // 清空輸入框應該在請求發送後
    setMessages(prevMessages => [...prevMessages, {
      id: Date.now().toString() + '-user',
      role: 'user',
      content: currentInput,
      timestamp: new Date()
    }]);
    setInput(''); // 立即清空輸入框，防止重複發送相同的訊息

    try {
      const response = await fetch('/api/edge/resume-ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, analysisId, threadId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error sending message:", errorData);
        toast({ title: "Error", description: errorData.message || "Failed to send message.", variant: "destructive" });
      } else {
        const data = await response.json();
        const newAssistantMessage = {
          id: data.threadId ? data.threadId + '-assistant-' + Date.now().toString() : Date.now().toString() + '-assistant',
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        };

        setMessages(prevMessages => {
          // 檢查是否已存在相同內容的 assistant 訊息
          if (!prevMessages.some(msg => msg.role === 'assistant' && msg.content === newAssistantMessage.content)) {
            return [...prevMessages, newAssistantMessage];
          }
          return prevMessages; // 如果已存在，則不添加
        });

        if (data.threadId && !threadId) {
          setThreadId(data.threadId);
        }
        if (data.guidanceForOptimization) {
          setGuidanceForOptimization(data.guidanceForOptimization);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="col-span-2 lg:col-span-1 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <OozeAnimation className="h-6 w-6" /> Ooze, Your Resume Alchemist
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <ScrollArea className="h-[calc(100vh-200px)] md:h-[calc(100vh-250px)] lg:h-[calc(100vh-300px)]">
          <div ref={messagesEndRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`mb-2 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-md p-2 text-sm w-fit max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="mb-2 flex justify-start">
                <div className="rounded-md p-2 text-sm w-fit max-w-[80%] bg-secondary text-secondary-foreground animate-pulse">
                  <Loader2 className="h-4 w-4 inline-block mr-2" /> Thinking...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <div className="p-4 flex items-center gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Ooze..."
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              handleSubmit(e);
            }
          }}
        />
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Send
        </Button>
      </div>
      {guidanceForOptimization && (
        <div className="p-4 border-t">
          <h6 className="text-sm font-semibold mb-2">Quick Actions:</h6>
          <div className="flex flex-wrap gap-2">
            {promptGuides.map((guide) => (
              <Button
                key={guide.text}
                variant="outline"
                size="sm"
                onClick={() => setInput(guide.text)}
              >
                {guide.icon} {guide.text}
              </Button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default OozeOptimizationSection;