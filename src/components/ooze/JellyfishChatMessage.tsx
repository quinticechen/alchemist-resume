
import React from 'react';
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/hooks/use-jellyfish-dialog";

interface JellyfishChatMessageProps {
  chat: ChatMessage;
  onApplySuggestion?: (suggestion: string) => void;
  index: number; // Add index prop to help with unique keys
}

const JellyfishChatMessage: React.FC<JellyfishChatMessageProps> = ({ 
  chat, 
  onApplySuggestion,
  index
}) => {
  // Generate a unique key for each message to prevent duplicates
  const messageKey = chat.threadId ? `${chat.threadId}-${index}` : `msg-${index}`;
  
  return (
    <div 
      key={messageKey}
      className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div 
        className={`rounded-lg p-3 max-w-[80%] ${
          chat.role === 'user' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        }`}
      >
        {chat.role === 'assistant' && (
          <div>
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
        )}
        
        {chat.role !== 'assistant' && (
          <p className="whitespace-pre-wrap">{chat.content}</p>
        )}
      </div>
    </div>
  );
};

export default JellyfishChatMessage;
