
import React, { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "./ChatMessage";
import { AlertCircle, Loader2 } from "lucide-react";
import OozeAnimation from "@/components/OozeAnimation";

interface ChatMessageListProps {
  messages: Array<{
    id: string;
    role: string;
    content: string;
    timestamp?: Date;
    suggestion?: string;
    section?: string;
  }>;
  apiError: string | null;
  effectiveAnalysisId: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onApplySuggestion: (suggestion: string, section: string) => void;
  dialogDescriptionId: string;
  guidanceForOptimization?: string;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ 
  messages, 
  apiError, 
  effectiveAnalysisId, 
  messagesEndRef, 
  onApplySuggestion, 
  dialogDescriptionId,
  guidanceForOptimization
}) => {
  const [isInitializing, setIsInitializing] = useState(messages.length === 0);

  useEffect(() => {
    if (messages.length > 0 && isInitializing) {
      setIsInitializing(false);
    }
  }, [messages.length, isInitializing]);

  return (
    <div className="flex-1 overflow-hidden" id={dialogDescriptionId}>
      <ScrollArea className="h-full pr-4">
        {isInitializing && effectiveAnalysisId ? (
          <div className="flex flex-col items-center justify-center h-full">
            <OozeAnimation width={120} height={120} />
            <p className="text-center text-muted-foreground mt-4">
              Initializing chat assistant...
            </p>
          </div>
        ) : messages.length === 0 && !effectiveAnalysisId ? (
          <div className="text-center p-4">
            <p className="text-muted-foreground">
              No analysis selected. Please select an analysis to chat with the AI assistant.
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onApplySuggestion={onApplySuggestion}
              />
            ))}
            
            {apiError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <p>{apiError}</p>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ChatMessageList;
