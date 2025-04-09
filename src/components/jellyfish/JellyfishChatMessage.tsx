
import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { ChatMessage } from "@/hooks/use-jellyfish-dialog";

interface JellyfishChatMessageProps {
  chat: ChatMessage;
  onApplySuggestion?: (suggestion: string) => void;
}

const JellyfishChatMessage: React.FC<JellyfishChatMessageProps> = ({ 
  chat, 
  onApplySuggestion 
}) => {
  return (
    <div className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`rounded-lg p-3 max-w-[80%] ${
          chat.role === 'user' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        }`}
      >
        <p className="whitespace-pre-wrap">{chat.content}</p>
        {chat.suggestion && onApplySuggestion && (
          <Button 
            variant="secondary" 
            size="sm" 
            className="mt-2"
            onClick={() => onApplySuggestion(chat.suggestion!)}
          >
            Apply Suggestion
          </Button>
        )}
      </div>
    </div>
  );
};

export default JellyfishChatMessage;
