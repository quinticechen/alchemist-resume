
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export interface ChatMessage {
  role: 'assistant' | 'user' | 'system';
  content: string;
  suggestion?: string;
  threadId?: string;
}

const universalSupportMessages = [
  "Hey there! I'm Seeker, ready to explore opportunities with you! How can I help you today?",
  "Welcome aboard! I'm Seeker, your friendly guide in this journey. I'm here to assist you with any questions or concerns.",
  "Hi! I'm Seeker, let's discover your perfect career path together! Have a question? Feel free to ask, and I'll do my best to help!",
  "Great to meet you! I'm Seeker, your companion in this job adventure! How can I help you today?"
];

export interface UseSeekerDialogOptions {
  simpleTipMode?: boolean;
  jobData?: any;
  onSuggestionApply?: (text: string, sectionId: string) => void;
  onGenerateSuggestion?: (sectionId: string) => void;
}

export function useSeekerDialog({
  simpleTipMode = false,
  jobData = null,
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
    const randomIndex = Math.floor(Math.random() * universalSupportMessages.length);
    setChats([{
      role: 'assistant',
      content: universalSupportMessages[randomIndex]
    }]);
  }, []);

  const handleOpenDialog = () => {
    if (simpleTipMode) {
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
        content: inputValue
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
      // Placeholder for AI response generation
      let aiResponse = generateAIResponse(userMessage);
      
      // Check if the message is requesting a suggestion for a section
      const lowerMessage = userMessage.toLowerCase();
      if (lowerMessage.includes('suggest') || lowerMessage.includes('improve') || lowerMessage.includes('optimize')) {
        const sectionMatches = [
          { term: 'summary', id: 'summary' },
          { term: 'experience', id: 'experience' },
          { term: 'education', id: 'education' },
          { term: 'skills', id: 'skills' },
          { term: 'projects', id: 'projects' }
        ];
        
        for (const match of sectionMatches) {
          if (lowerMessage.includes(match.term)) {
            // If we have job data and the callback, generate a suggestion
            if (jobData && onGenerateSuggestion) {
              onGenerateSuggestion(match.id);
              
              // Add additional response for suggestion generation
              aiResponse = `I'm generating suggestions for your ${match.term} section based on the job description. One moment please...`;
              
              // Add a simulated suggestion after a delay if we have the callback
              if (onSuggestionApply) {
                setTimeout(() => {
                  const suggestion = `Here's a suggested improvement for your ${match.term} section based on the job description: [Example suggestion content]`;
                  
                  setChats(prev => [...prev, {
                    role: 'assistant',
                    content: suggestion,
                    suggestion: `[Example suggestion for ${match.term}]`,
                    threadId: match.id
                  }]);
                }, 2000);
              }
              break;
            }
          }
        }
      }
      
      setTimeout(() => {
        setChats(prev => [...prev, {
          role: 'assistant',
          content: aiResponse
        }]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setApiError("Failed to connect to support service. Please try again.");
      setIsLoading(false);
    }
  };
  
  const generateAIResponse = (userMessage: string): string => {
    // Very basic response generation logic
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return "I'm here to help! Could you please provide more details about what you need assistance with?";
    }
    
    if (lowerMessage.includes('pricing') || lowerMessage.includes('plan')) {
      return "Our pricing plans are designed to suit various needs. Would you like me to guide you through our different options?";
    }
    
    if (lowerMessage.includes('resume') || lowerMessage.includes('job')) {
      return "I can help you with resume optimization and job-related guidance. What specific area would you like assistance with?";
    }
    
    return "Thank you for your message. I'm processing your request and will provide the best possible assistance.";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const showRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * universalSupportMessages.length);
    setMessage(universalSupportMessages[randomIndex]);
    setIsDialogOpen(true);
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
    handleKeyDown,
    
    // Helpers
    showRandomTip
  };
}
