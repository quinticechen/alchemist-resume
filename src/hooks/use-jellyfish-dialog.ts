
import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ChatMessage {
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

export interface UseJellyfishDialogOptions {
  simpleTipMode?: boolean;
  currentSectionId?: string;
  onGenerateSuggestion?: (sectionId: string) => void;
  onSuggestionApply?: (text: string, sectionId: string) => void;
  jobData?: any;
}

export function useJellyfishDialog({
  simpleTipMode = false,
  currentSectionId = "",
  onGenerateSuggestion,
  onSuggestionApply,
  jobData = null
}: UseJellyfishDialogOptions = {}) {
  // UI state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [inputValue, setInputValue] = useState("");
  
  // Functional state
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [autoSuggestionTimerId, setAutoSuggestionTimerId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [hasInitialJobContext, setHasInitialJobContext] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [resumeContentSent, setResumeContentSent] = useState<boolean>(false);
  
  const { toast } = useToast();
  const location = useLocation();
  const params = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Handle auto-scroll when chat updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  // Extract analysis ID from URL or state
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

  // Initialize chat and set up auto-suggestion timer
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

  // Reset job context when sheet closes
  useEffect(() => {
    if (!isSheetOpen) {
      setHasInitialJobContext(false);
    }
  }, [isSheetOpen]);

  // Find existing thread for current analysis
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
          
          // Mark that we've already sent resume content for existing threads
          setResumeContentSent(true);
        } else {
          console.log(`No existing thread found for analysis: ${analysisId}`);
        }
      } catch (error) {
        console.error('Error finding existing thread:', error);
      }
    };
    
    findExistingThread();
  }, [analysisId, currentSectionId, simpleTipMode]);

  // Function to fetch resume content from resume_editors
  const fetchResumeContent = async () => {
    if (!analysisId) return null;
    
    try {
      const { data, error } = await supabase
        .from('resume_editors')
        .select('content')
        .eq('analysis_id', analysisId)
        .single();

      if (error) throw error;
      return data?.content ? JSON.stringify(data.content) : null;
    } catch (error) {
      console.error('Error fetching resume content:', error);
      return null;
    }
  };

  // Helper functions
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
      
      // Check if we need to get resume content for the first message
      let resumeContent = null;
      if (!resumeContentSent) {
        resumeContent = await fetchResumeContent();
        setResumeContentSent(true);
        console.log("Sending resume content with first message");
      }
      
      const { data, error } = await supabase.functions.invoke('resume-ai-assistant', {
        body: { 
          message,
          analysisId,
          currentSection: currentSectionId,
          threadId: currentThreadId,
          resumeContent: resumeContent
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

  const handleApplySuggestion = (suggestion: string) => {
    if (onSuggestionApply && currentSectionId) {
      onSuggestionApply(suggestion, currentSectionId);
      
      toast({
        title: "Suggestion Applied",
        description: "The suggestion has been applied to your resume."
      });
    }
  };

  return {
    // State
    isDialogOpen,
    isSheetOpen,
    message,
    inputValue,
    chats,
    isLoading,
    isRetrying,
    apiError,
    currentThreadId,
    analysisId,
    messagesEndRef,
    
    // Actions
    setIsDialogOpen,
    setIsSheetOpen,
    setInputValue,
    handleOpenDialog,
    handleSendMessage,
    handleKeyDown,
    handleGenerateSuggestion,
    handleRetry,
    handleApplySuggestion,
    
    // Helpers
    showRandomTip
  };
}
