
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bot, User } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/hooks/use-ai-chat";

interface ChatMessageProps {
  message: ChatMessageType;
  onApplySuggestion: (suggestion: string, section: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onApplySuggestion }) => {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <Card 
        className={`p-3 max-w-[80%] ${
          message.role === 'user' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        }`}
      >
        <div className="flex items-start gap-2">
          {message.role === 'assistant' && <Bot className="h-5 w-5 mt-1 flex-shrink-0" />}
          <div>
            <div className="whitespace-pre-wrap">{message.content}</div>
            {message.suggestion && message.section && (
              <Button 
                className="mt-2" 
                size="sm"
                onClick={() => onApplySuggestion(message.suggestion!, message.section!)}
              >
                Apply Suggestion
              </Button>
            )}
          </div>
          {message.role === 'user' && <User className="h-5 w-5 mt-1 flex-shrink-0" />}
        </div>
      </Card>
    </div>
  );
};

export default ChatMessage;
