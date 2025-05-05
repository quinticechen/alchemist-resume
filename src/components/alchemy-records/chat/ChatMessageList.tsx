
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ChatMessage from "./ChatMessage";
import { AlertCircle, Loader2 } from "lucide-react";
import OozeAnimation from "@/components/OozeAnimation";
import type { ChatMessage as ChatMessageType } from "@/hooks/use-ai-chat";

interface ChatMessageListProps {
  messages: Array<{
    id: string;
    role: string;
    content: string;
    timestamp?: Date;
    section?: string;
    suggestion?: string;
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
  const filteredMessages = messages.filter(msg => msg.role !== 'system');
  
  return (
    <ScrollArea id={dialogDescriptionId} className="flex-1 px-4 py-2 overflow-y-auto">
      {!effectiveAnalysisId ? (
        <div className="flex flex-col items-center justify-center h-full">
          <OozeAnimation width={120} height={120} />
          <p className="text-center text-muted-foreground mt-4">
            Loading assistant...
          </p>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full">
          <OozeAnimation width={120} height={120} />
          <p className="text-center text-muted-foreground mt-4">
            No messages yet. Start a conversation with Ooze!
          </p>
          {guidanceForOptimization && (
            <Alert className="mt-4 max-w-md">
              <AlertDescription className="text-sm whitespace-pre-wrap">
                {guidanceForOptimization}
              </AlertDescription>
            </Alert>
          )}
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          {filteredMessages.map((message) => (
            <ChatMessage
              key={message.id}
              message={{
                ...message,
                role: message.role as "user" | "assistant" | "system",
                timestamp: message.timestamp || new Date() // Ensure timestamp is always defined
              }}
              onApplySuggestion={onApplySuggestion}
            />
          ))}
          
          {apiError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {apiError}
              </AlertDescription>
            </Alert>
          )}
          
          {messagesEndRef && <div ref={messagesEndRef} />}
        </div>
      )}
    </ScrollArea>
  );
};

export default ChatMessageList;
