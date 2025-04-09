import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import JellyfishAnimation from "@/components/JellyfishAnimation";
import { MessageCircle, Lightbulb, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";

interface JellyfishDialogProps {
  className?: string;
  title?: string;
  position?: "top" | "middle" | "bottom";
  currentSectionId?: string;
  onSuggestionApply?: (text: string, sectionId: string) => void;
  onGenerateSuggestion?: (sectionId: string) => void;
  simpleTipMode?: boolean;
  jobData?: any;
}

interface ChatMessage {
  role: 'assistant' | 'user' | 'system';
  content: string;
  suggestion?: string;
  threadId?: string;
}

const welcomeMessages = [
  "Welcome! I'm your resume assistant! Click me anytime for resume tips!",
  "Hi there! Need help optimizing your resume? I'm here to help!",
  "Hello resume creator! I'm your friendly AI assistant!",
  "Greetings! I'm your resume buddy! Let me know if you need suggestions!"
];

const resumeTips = [
  "Quantify your achievements with numbers whenever possible!",
  "Use action verbs at the beginning of your bullet points.",
  "Tailor your resume for each job application by highlighting relevant experience.",
  "Keep your resume concise - one to two pages maximum.",
  "Include keywords from the job description to pass ATS screening.",
  "Focus on achievements rather than just listing job duties.",
  "Use a clean, professional format with consistent styling.",
  "Proofread carefully - typos and grammar errors can cost you an interview!",
  "Include a strong summary that highlights your unique value proposition.",
  "For experience older than 10-15 years, consider removing dates to avoid age bias.",
  "Use white space effectively to make your resume easy to scan.",
  "Consider adding a skills section to highlight technical abilities.",
  "Avoid using personal pronouns (I, me, my) in your resume.",
  "Save your resume as a PDF to maintain formatting across devices.",
  "Use reverse chronological order for your work experience."
];

const JellyfishDialog: React.FC<JellyfishDialogProps> = ({ 
  className = "",
  title = "Resume Assistant",
  position = "middle",
  currentSectionId = "",
  onSuggestionApply,
  onGenerateSuggestion,
  simpleTipMode = false,
  jobData = null
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [autoSuggestionTimerId, setAutoSuggestionTimerId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialJobContext, setHasInitialJobContext] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const { toast } = useToast();
  const location = useLocation();
  const dialogDescriptionId = "jellyfishDialogDescription";
  const sheetDescriptionId = "jellyfishSheetDescription";

  const getAnalysisIdFromUrl = () => {
    const pathSegments = location.pathname.split('/');
    const analysisId = pathSegments[pathSegments.length - 1];
    if (analysisId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(analysisId)) {
      console.log(`Extracted analysisId from URL: ${analysisId}`);
      return analysisId;
    }
    return null;
  };

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
    setChats([{
      role: 'assistant',
      content: welcomeMessages[randomIndex]
    }]);

    if (!simpleTipMode) {
      const timerId = window.setInterval(() => {
        if (!isDialogOpen && !isSheetOpen) {
          showRandomTip();
        }
      }, Math.random() * 60000 + 120000);

      setAutoSuggestionTimerId(timerId);

      return () => {
        if (autoSuggestionTimerId) {
          clearInterval(autoSuggestionTimerId);
        }
      };
    }
  }, [simpleTipMode]);

  useEffect(() => {
    if (!isSheetOpen) {
      setHasInitialJobContext(false);
    }
  }, [isSheetOpen]);

  useEffect(() => {
    const findExistingThread = async () => {
      if (!currentSectionId || simpleTipMode) return;
      
      try {
        const analysisId = getAnalysisIdFromUrl();
        if (!analysisId) {
          console.warn("Could not determine analysis ID from URL");
          return;
        }
        
        console.log(`Looking for existing thread for analysis: ${analysisId}`);
        
        const { data: metadataData, error: metadataError } = await supabase
          .from('ai_chat_metadata')
          .select('*')
          .eq('analysis_id', analysisId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (!metadataError && metadataData && metadataData.length > 0) {
          setCurrentThreadId(metadataData[0].thread_id);
          console.log(`Found existing thread: ${metadataData[0].thread_id}`);
        } else {
          console.log(`No existing thread found for analysis: ${analysisId}`);
        }
      } catch (error) {
        console.error('Error finding existing thread:', error);
      }
    };
    
    findExistingThread();
  }, [currentSectionId, simpleTipMode]);

  const getRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * resumeTips.length);
    return resumeTips[randomIndex];
  };

  const showRandomTip = () => {
    setMessage(getRandomTip());
    setIsDialogOpen(true);
  };

  const handleOpenDialog = () => {
    if (simpleTipMode) {
      showRandomTip();
    } else {
      setIsSheetOpen(!isSheetOpen);
    }
  };

  const handleGenerateSuggestion = async () => {
    if (onGenerateSuggestion && currentSectionId) {
      onGenerateSuggestion(currentSectionId);
      
      setChats(prev => [...prev, {
        role: 'user',
        content: `Please help me improve the ${currentSectionId} section of my resume.`
      }]);
      
      await sendToAIAssistant(`Please generate a suggestion for the ${currentSectionId} section of my resume that would make it more impactful and professional.`);
      
      setHasInitialJobContext(true);
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      setChats(prev => [...prev, {
        role: 'user',
        content: inputValue
      }]);
      
      const message = inputValue;
      setInputValue("");
      
      await sendToAIAssistant(message);
      
      if (!hasInitialJobContext) {
        setHasInitialJobContext(true);
      }
    }
  };

  const sendToAIAssistant = async (message: string) => {
    setIsLoading(true);
    try {
      const analysisId = getAnalysisIdFromUrl();
      
      if (!analysisId) {
        throw new Error("Could not determine analysis ID from URL");
      }
      
      console.log(`Sending message to AI assistant for analysis: ${analysisId}`);
      
      const { data, error } = await supabase.functions.invoke('resume-ai-assistant', {
        body: { 
          message,
          analysisId,
          resumeId: undefined,
          currentSection: currentSectionId,
          history: chats,
          threadId: currentThreadId,
          includeJobData: !hasInitialJobContext
        }
      });
      
      if (error) throw error;
      
      let suggestion = null;
      let content = data.message;
      let threadId = data.threadId;
      let systemPrompt = data.systemPrompt;
      
      if (threadId) {
        setCurrentThreadId(threadId);
        
        console.log(`Chat using OpenAI thread: ${threadId}`);
      }
      
      if (data.suggestion) {
        suggestion = data.suggestion;
      }
      
      if (systemPrompt) {
        const hasSystemPrompt = chats.some(chat => 
          chat.role === 'system' && chat.threadId === threadId
        );
        
        if (!hasSystemPrompt) {
          setChats(prev => [...prev, {
            role: 'system',
            content: systemPrompt,
            threadId: threadId
          }]);
        }
      }
      
      setChats(prev => [...prev, {
        role: 'assistant',
        content: content,
        suggestion: suggestion,
        threadId: threadId
      }]);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      setChats(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again later."
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

  const positionClasses = {
    top: "top-24",
    middle: "top-1/2 -translate-y-1/2",
    bottom: "bottom-24"
  };

  const handleApplySuggestion = (suggestion: string) => {
    if (onSuggestionApply && currentSectionId) {
      onSuggestionApply(suggestion, currentSectionId);
    }
  };

  const dialogTitle = simpleTipMode ? "Alchemy Ooze" : "Resume Assistant";
  const sheetTitle = "Chat with Alchemy Ooze";

  const groupedChats = chats.filter(chat => chat.role !== 'system');

  return (
    <>
      <div className={`fixed right-6 ${positionClasses[position]} z-50 ${className}`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenDialog}
          className="hover:bg-transparent p-0 h-auto w-auto relative group"
        >
          <div className="absolute -top-10 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background text-xs p-2 rounded shadow whitespace-nowrap">
            {simpleTipMode ? "View Resume Tip" : "Chat with Alchemy Ooze"}
          </div>
          <JellyfishAnimation width={120} height={120} />
          {!simpleTipMode && (
            <MessageCircle className="absolute bottom-6 right-6 bg-primary text-primary-foreground rounded-full p-1 h-6 w-6 animate-pulse" />
          )}
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby={dialogDescriptionId}>
          <DialogHeader>
            <DialogTitle className="text-center">{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4" id={dialogDescriptionId}>
            <JellyfishAnimation width={150} height={150} />
            <p className="text-center text-lg font-medium text-primary">{message}</p>
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Thanks!
              </Button>
              {!simpleTipMode && (
                <Button 
                  onClick={() => {
                    setIsDialogOpen(false);
                    setIsSheetOpen(true);
                  }}
                >
                  Chat with Alchemy Ooze
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {!simpleTipMode && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-hidden flex flex-col" aria-describedby={sheetDescriptionId}>
            <SheetHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <JellyfishAnimation width={50} height={50} />
                  <SheetTitle>{sheetTitle}</SheetTitle>
                </div>
              </div>
            </SheetHeader>
            
            <ScrollArea className="flex-1 p-4 mt-2 mb-4" id={sheetDescriptionId}>
              <div className="flex flex-col gap-4">
                {groupedChats.map((chat, index) => (
                  <div 
                    key={index} 
                    className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`rounded-lg p-3 max-w-[80%] ${
                        chat.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{chat.content}</p>
                      {chat.suggestion && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => handleApplySuggestion(chat.suggestion!)}
                        >
                          Apply Suggestion
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="border-t pt-4 pb-2 space-y-4">
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={handleGenerateSuggestion}
                disabled={isLoading}
              >
                <Lightbulb className="h-4 w-4" />
                Generate Suggestion for Current Section
              </Button>
              
              <div className="flex gap-2">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask for resume advice..."
                  className="resize-none"
                  disabled={isLoading}
                />
                <Button size="icon" onClick={handleSendMessage} disabled={isLoading || inputValue.trim() === ''}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {isLoading && <p className="text-sm text-muted-foreground">AI is thinking...</p>}
              {currentThreadId && (
                <p className="text-xs text-muted-foreground">
                  Thread ID: {currentThreadId.substring(0, 12)}...
                </p>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};

export default JellyfishDialog;
