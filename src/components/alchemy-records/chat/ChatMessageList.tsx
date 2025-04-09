
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/hooks/use-ai-chat";
import ChatMessage from "./ChatMessage";

interface ChatMessageListProps {
  messages: ChatMessageType[];
  apiError: string | null;
  effectiveAnalysisId: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onApplySuggestion: (suggestion: string, section: string) => void;
  dialogDescriptionId: string;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ 
  messages,
  apiError,
  effectiveAnalysisId,
  messagesEndRef,
  onApplySuggestion,
  dialogDescriptionId
}) => {
  return (
    <ScrollArea className="p-4 h-[400px]">
      <div className="space-y-4" id={dialogDescriptionId}>
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message} 
            onApplySuggestion={onApplySuggestion} 
          />
        ))}
        
        {apiError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <p>{apiError}</p>
          </div>
        )}
        
        {!effectiveAnalysisId && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <p className="font-medium">Unable to find resume analysis ID</p>
            <p className="text-sm mt-1">Please ensure you're accessing this page correctly from your resume list.</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default ChatMessageList;
