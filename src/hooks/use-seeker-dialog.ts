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
  "Hi! I'm Seeker, hello new friend! Welcome aboard the Resume Alchemist! I'm your buddy Seeker! Don't worry—with me by your side, I guarantee we'll ride the waves and find your dream treasure!", 
  "Hi! I'm Seeker, first time here? Fantastic! There are so many amazing features to discover—let's explore together! I promise you'll be amazed!",
  "Hi! I'm Seeker, come on! Let me show you around every corner of this ship! Together we'll craft a resume that will take everyone's breath away!",
  "Hi! I'm Seeker, see that glowing button over there? That's our magical starting point! Are you ready?",
  "Hi! I'm Seeker, trust me—everyone has their own special sparkle. Let me help you find yours!"
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

export interface UseSeekerDialogOptions {
  simpleTipMode?: boolean;
  currentSectionId?: string;
  onGenerateSuggestion?: (sectionId: string) => void;
  onSuggestionApply?: (text: string, sectionId: string) => void;
  jobData?: any;
}

export function useSeekerDialog({
  simpleTipMode = false,
  currentSectionId = "",
  onGenerateSuggestion,
  onSuggestionApply,
  jobData = null
}: UseSeekerDialogOptions = {}) {
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
        return params.analysisId;
      }
      
      // Then check URL path segments for UUID format
      const pathSegments = location.pathname.split('/');
      const potentialIds = pathSegments.filter(segment => 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
      );
      
      if (potentialIds.length > 0) {
        return potentialIds[0];
      }
      
      // Finally check location state
      if (location.state && location.state.analysisId) {
        return location.state.analysisId;
      }
      
      return null;
    };
    
    const id = extractAnalysisId();
    setAnalysisId(id);
    
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
          // Mark that we've already sent resume content for existing threads
          setResumeContentSent(true);
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
      await sendToAIAssistant(lastUserMessage.content, true);
    } finally {
      setIsRetrying(false);
    }
  };

  const sendToAIAssistant = async (message: string, isRetry = false) => {
    setIsLoading(true);
    setApiError(null);
    
    try {
      // 準備上下文信息
      let contextMessage = '';
      
      if (!hasInitialJobContext && !resumeContentSent && jobData) {
        contextMessage = `Here's information about the job I'm applying for:\n${JSON.stringify(jobData)}`;
      }
      
      // 如果有分析ID，獲取簡歷內容
      let resumeContent = null;
      if (analysisId && !resumeContentSent) {
        resumeContent = await fetchResumeContent();
        setResumeContentSent(true);
      }
      
      // 創建請求數據
      const requestBody: any = { 
        message: contextMessage ? `${contextMessage}\n\n${message}` : message,
        threadId: currentThreadId,
        mode: analysisId ? 'resume' : 'general'
      };
      
      // 只有在簡歷模式下添加這些字段
      if (analysisId) {
        requestBody.analysisId = analysisId;
        requestBody.currentSection = currentSectionId;
        requestBody.resumeContent = resumeContent;
      }
      
      const { data, error } = await supabase.functions.invoke('resume-ai-assistant', {
        body: requestBody
      });
      
      if (error) {
        console.error('Error invoking AI assistant:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error("No data returned from AI assistant");
      }
      
      // 處理響應數據
      if (data.threadId && data.threadId !== currentThreadId) {
        setCurrentThreadId(data.threadId);
      }
      
      const suggestion = data.suggestion || null;
      
      // 更新聊天記錄
      setChats(prev => {
        // 如果是重試，替換最後一條助手消息
        if (isRetry) {
          const lastAssistantIndex = [...prev].reverse().findIndex(msg => msg.role === 'assistant');
          if (lastAssistantIndex !== -1) {
            // 移除最後一條助手消息
            const newChats = [...prev];
            newChats.splice(prev.length - 1 - lastAssistantIndex, 1);
            
            // 添加新消息
            return [...newChats, {
              role: 'assistant',
              content: data.message,
              suggestion,
              section: currentSectionId,
              threadId: data.threadId
            }];
          }
        }
        
        // 否則只添加新消息
        return [...prev, {
          role: 'assistant',
          content: data.message,
          suggestion,
          section: currentSectionId,
          threadId: data.threadId
        }];
      });
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      setApiError(error instanceof Error ? error.message : String(error));
      
      setChats(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again later."
      }]);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get a response from the AI assistant",
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
