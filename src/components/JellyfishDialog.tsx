
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import JellyfishAnimation from "@/components/JellyfishAnimation";
import { MessageCircle, Lightbulb, Send, AlertTriangle, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "react-router-dom";

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
  const [isRetrying, setIsRetrying] = useState(false);
  const [hasInitialJobContext, setHasInitialJobContext] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();
  const location = useLocation();
  const params = useParams();
  const dialogDescriptionId = "jellyfishDialogDescription";
  const sheetDescriptionId = "jellyfishSheetDescription";
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when chat changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  useEffect(() => {
    const extractAnalysisId = () => {
      // First check URL parameters
      if (params.analysisId) {
        console.log(`Found analysis ID in URL params: ${params.analysisId}`);
        return params.analysisId;
      }
      
      // Then check URL path segments for UUID format
      const pathSegments = location.pathname.split('/');
      const potentialIds = pathSegments.filter(segment => 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
      );
      
      if (potentialIds.length > 0) {
        console.log(`Found analysis ID in URL path: ${potentialIds[0]}`);
        return potentialIds[0];
      }
      
      // Finally check location state
      if (location.state && location.state.analysisId) {
        console.log(`Found analysis ID in location state: ${location.state.analysisId}`);
        return location.state.analysisId;
      }
      
      console.warn("Could not determine analysis ID from URL or state");
      return null;
    };
    
    const id = extractAnalysisId();
    setAnalysisId(id);
    console.log(`JellyfishDialog initialized with analysis ID: ${id || "none"}`);
    
    // Reset error state when analysis ID changes
    setApiError(null);
  }, [location, params]);

  useEffect(() => {
    // Initialize chat with a random welcome message
    const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
    setChats([{
      role: 'assistant',
      content: welcomeMessages[randomIndex]
    }]);

    // Set up auto-suggestion timer (if not in simpleTipMode)
    if (!simpleTipMode) {
      const timerId = window.setInterval(() => {
        if (!isDialogOpen && !isSheetOpen) {
          showRandomTip();
        }
      }, Math.random() * 60000 + 120000); // Random time between 2-3 minutes

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
      if (!analysisId || !currentSectionId || simpleTipMode) return;
      
      try {
        console.log(`Looking for existing thread for analysis: ${analysisId}`);
        
        const { data: metadataData, error: metadataError } = await supabase
          .from('ai_chat_metadata')
          .select('*')
          .eq('analysis_id', analysisId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (metadataError) {
          console.error('Error fetching thread metadata:', metadataError);
          return;
        }
        
        if (metadataData && metadataData.length > 0) {
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
  }, [analysisId, currentSectionId, simpleTipMode]);

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
    if (!analysisId) {
      toast({
        title: "Error",
        description: "Unable to identify the current resume analysis. Try refreshing the page.",
        variant: "destructive"
      });
      return;
    }
    
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
    if (!analysisId) {
      toast({
        title: "Error",
        description: "Unable to identify the current resume analysis. Try refreshing the page.",
        variant: "destructive"
      });
      return;
    }
    
    if (inputValue.trim()) {
      setApiError(null);
      
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
  
  const handleRetry = async () => {
    if (!analysisId || chats.length === 0) return;
    
    setIsRetrying(true);
    setApiError(null);
    
    // Get the last user message
    const lastUserMessage = [...chats]
      .filter(msg => msg.role === 'user')
      .pop();
      
    if (!lastUserMessage) {
      setIsRetrying(false);
      return;
    }
    
    try {
      await sendToAIAssistant(lastUserMessage.content);
    } finally {
      setIsRetrying(false);
    }
  };

  const sendToAIAssistant = async (message: string) => {
    if (!analysisId) {
      toast({
        title: "Error",
        description: "Unable to identify the current resume analysis. Try refreshing the page.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      console.log(`Sending message to AI assistant for analysis: ${analysisId}`);
      console.log(`Using thread ID: ${currentThreadId || "new thread"}`);
      
      const { data, error } = await supabase.functions.invoke('resume-ai-assistant', {
        body: { 
          message,
          analysisId,
          currentSection: currentSectionId,
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
      let systemPrompt = data.systemPrompt;
      
      if (threadId) {
        setCurrentThreadId(threadId);
        console.log(`Chat using OpenAI thread: ${threadId}`);
      } else {
        console.warn("No thread ID returned from resume-ai-assistant");
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
      
      // Add AI response to chat
      setChats(prev => [...prev, {
        role: 'assistant',
        content: content,
        suggestion: suggestion,
        threadId: threadId
      }]);
      
      setApiError(null);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      setApiError(`Failed to connect to AI service. Please try again.`);
      
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
      
      toast({
        title: "Suggestion Applied",
        description: "The suggestion has been applied to your resume."
      });
    }
  };

  const dialogTitle = simpleTipMode ? "Alchemy Ooze" : "Resume Assistant";
  const sheetTitle = "Chat with Alchemy Ooze";

  // Filter out system messages for display
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
                
                {apiError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <p>{apiError}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="self-end" 
                      onClick={handleRetry}
                      disabled={isRetrying}
                    >
                      {isRetrying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        'Retry'
                      )}
                    </Button>
                  </div>
                )}
                
                {!analysisId && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                    <p className="font-medium">Unable to find resume analysis ID</p>
                    <p className="text-sm mt-1">Try refreshing the page or navigating back to the resume list.</p>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <div className="border-t pt-4 pb-2 space-y-4">
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={handleGenerateSuggestion}
                disabled={isLoading || !analysisId}
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
                  disabled={isLoading || !analysisId}
                />
                <Button 
                  size="icon" 
                  onClick={handleSendMessage} 
                  disabled={isLoading || inputValue.trim() === '' || !analysisId}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {isLoading && <p className="text-sm text-muted-foreground">AI is thinking...</p>}
              
              {currentThreadId && (
                <p className="text-xs text-muted-foreground">
                  Thread ID: {currentThreadId.substring(0, 12)}...
                </p>
              )}
              {analysisId && (
                <p className="text-xs text-muted-foreground">
                  Analysis ID: {analysisId.substring(0, 8)}...
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
