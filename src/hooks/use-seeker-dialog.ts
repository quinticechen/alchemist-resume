
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export interface ChatMessage {
  role: 'assistant' | 'user' | 'system';
  content: string;
  suggestion?: string;
  threadId?: string;
  sectionId?: string;
}

const resumeAlchemistMessages = [
  "Ready to transform your resume into pure gold! Let me help you optimize each section.",
  "Ooze is here to sprinkle some alchemical magic on your resume!",
  "Let's turn your resume from ordinary to extraordinary! Which section shall we alchemize first?",
  "Greetings, Resume Alchemist at your service! Shall we refine your professional masterpiece?"
];

const universalSupportMessages = [
  "Hi there! I'm Ooze, your friendly assistant. How can I help you today?",
  "Hello! I'm here to assist you. What can I help you with?",
  "Greetings! I'm Ooze, ready to provide support. What do you need help with?",
  "Welcome! I'm your AI assistant Ooze. How may I assist you today?"
];

export interface UseSeekerDialogOptions {
  resumeEditMode?: boolean;
  jobData?: any;
  currentSectionId?: string;
  onSuggestionApply?: (text: string, sectionId: string) => void;
  onGenerateSuggestion?: (sectionId: string) => void;
}

export function useSeekerDialog({
  resumeEditMode = false,
  jobData = null,
  currentSectionId,
  onSuggestionApply,
  onGenerateSuggestion
}: UseSeekerDialogOptions = {}) {
  // UI state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [inputValue, setInputValue] = useState("");
  
  // Functional state
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Handle auto-scroll when chat updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  // Initialize chat with a welcome message
  useEffect(() => {
    const messages = resumeEditMode 
      ? resumeAlchemistMessages 
      : universalSupportMessages;
    
    const randomIndex = Math.floor(Math.random() * messages.length);
    setChats([{
      role: 'assistant',
      content: messages[randomIndex],
      ...(resumeEditMode && currentSectionId ? { sectionId: currentSectionId } : {})
    }]);
  }, [resumeEditMode, currentSectionId]);

  const handleOpenDialog = () => {
    if (resumeEditMode) {
      setIsDialogOpen(true);
    } else {
      setIsSheetOpen(!isSheetOpen);
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      setApiError(null);
      
      // Add user message
      setChats(prev => [...prev, {
        role: 'user',
        content: inputValue,
        ...(currentSectionId ? { sectionId: currentSectionId } : {})
      }]);
      
      const message = inputValue;
      setInputValue("");
      
      // Simulate AI response (replace with actual AI service later)
      await simulateAIResponse(message);
    }
  };
  
  const simulateAIResponse = async (userMessage: string) => {
    setIsLoading(true);
    try {
      // Enhanced logic for resume editing
      let aiResponse = generateAIResponse(userMessage);
      
      if (resumeEditMode && currentSectionId && onGenerateSuggestion) {
        onGenerateSuggestion(currentSectionId);
        
        // Simulate suggestion generation
        setTimeout(() => {
          const suggestion = `Here's an optimization for your ${currentSectionId} section: [Example suggestion for ${currentSectionId}]`;
          
          setChats(prev => [...prev, {
            role: 'assistant',
            content: suggestion,
            suggestion: `[Example suggestion for ${currentSectionId}]`,
            sectionId: currentSectionId
          }]);
        }, 1500);
      }
      
      setTimeout(() => {
        setChats(prev => [...prev, {
          role: 'assistant',
          content: aiResponse,
          ...(currentSectionId ? { sectionId: currentSectionId } : {})
        }]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setApiError("Failed to connect to Resume Alchemist. Please try again.");
      setIsLoading(false);
    }
  };
  
  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (resumeEditMode) {
      // Resume editing specific responses
      if (lowerMessage.includes('help') || lowerMessage.includes('improve')) {
        return "I can help you improve your resume section. What specific guidance do you need?";
      }
      
      if (currentSectionId) {
        return `Let's focus on optimizing your ${currentSectionId} section. What aspect would you like to enhance?`;
      }
    }
    
    // Fallback universal support messages
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return "I'm here to help! Could you provide more details about what you need?";
    }
    
    return "Thank you for your message. I'll do my best to assist you.";
  };

  return {
    // State
    isDialogOpen,
    isSheetOpen,
    message,
    inputValue,
    chats,
    isLoading,
    apiError,
    messagesEndRef,
    
    // Actions
    setIsDialogOpen,
    setIsSheetOpen,
    setInputValue,
    handleOpenDialog,
    handleSendMessage,
    handleKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
  };
}
