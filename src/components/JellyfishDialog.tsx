
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import JellyfishAnimation from "@/components/JellyfishAnimation";
import { MessageCircle, Lightbulb, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

interface JellyfishDialogProps {
  className?: string;
  title?: string;
  position?: "top" | "middle" | "bottom";
  currentSectionId?: string;
  onSuggestionApply?: (text: string, sectionId: string) => void;
  onGenerateSuggestion?: (sectionId: string) => void;
}

const welcomeMessages = [
  "Welcome! I'm your resume assistant jellyfish! Click me anytime for resume tips!",
  "Hi there! Need help optimizing your resume? I'm here to help!",
  "Hello resume creator! I'm your friendly AI jellyfish assistant!",
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
  title = "Resume Assistant Jellyfish",
  position = "middle",
  currentSectionId = "",
  onSuggestionApply,
  onGenerateSuggestion
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [chats, setChats] = useState<{role: 'assistant' | 'user', content: string, suggestion?: string}[]>([]);
  const [autoSuggestionTimerId, setAutoSuggestionTimerId] = useState<number | null>(null);

  useEffect(() => {
    // Add welcome message on first load
    const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
    setChats([{
      role: 'assistant',
      content: welcomeMessages[randomIndex]
    }]);

    // Set up auto suggestion timer (every 2-3 minutes)
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
  }, []);

  const getRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * resumeTips.length);
    return resumeTips[randomIndex];
  };

  const showRandomTip = () => {
    setMessage(getRandomTip());
    setIsDialogOpen(true);
  };

  const handleOpenDialog = () => {
    if (isSheetOpen) {
      setIsSheetOpen(false);
    } else {
      setIsSheetOpen(true);
    }
  };

  const handleGenerateSuggestion = () => {
    if (onGenerateSuggestion && currentSectionId) {
      onGenerateSuggestion(currentSectionId);
    }
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      // Add user message to chat
      setChats(prev => [...prev, {
        role: 'user',
        content: inputValue
      }]);
      
      // Clear input
      setInputValue("");
      
      // TODO: This would be where we'd send the message to the AI
      // For now, just add a placeholder response
      setTimeout(() => {
        setChats(prev => [...prev, {
          role: 'assistant',
          content: "I'm processing your question. I'll have a response for you shortly!"
        }]);
      }, 500);
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
            Chat with Resume Jellyfish!
          </div>
          <JellyfishAnimation width={120} height={120} />
          <MessageCircle className="absolute bottom-6 right-6 bg-primary text-primary-foreground rounded-full p-1 h-6 w-6 animate-pulse" />
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <JellyfishAnimation width={150} height={150} />
            <p className="text-center text-lg font-medium text-primary">{message}</p>
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Thanks!
              </Button>
              <Button 
                onClick={() => {
                  setIsDialogOpen(false);
                  setIsSheetOpen(true);
                }}
              >
                Chat with Jellyfish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-hidden flex flex-col">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <JellyfishAnimation width={50} height={50} />
              <SheetTitle>Resume Assistant Jellyfish</SheetTitle>
            </div>
          </SheetHeader>
          
          <ScrollArea className="flex-1 p-4 mt-2 mb-4">
            <div className="flex flex-col gap-4">
              {chats.map((chat, index) => (
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
            >
              <Lightbulb className="h-4 w-4" />
              Generate Suggestion for Current Section
            </Button>
            
            <div className="flex gap-2">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the jellyfish for resume advice..."
                className="resize-none"
              />
              <Button size="icon" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default JellyfishDialog;
