
import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import PromptGuides from './PromptGuides';

interface ChatInputAreaProps {
  input: string;
  setInput: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleSendMessage: () => void;
  isLoading: boolean;
  threadId: string | null;
  isDisabled: boolean;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  input,
  setInput,
  handleKeyDown,
  handleSendMessage,
  isLoading,
  threadId,
  isDisabled
}) => {
  return (
    <div className="pt-3 border-t mt-auto">
      <PromptGuides 
        onPromptSelect={(text) => setInput(text)}
        isDisabled={isDisabled}
      />
      
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask for resume optimization suggestions..."
          className="resize-none text-sm"
          rows={2}
          disabled={isDisabled}
        />
        <Button 
          onClick={handleSendMessage} 
          disabled={isDisabled || input.trim() === ''}
          size="icon"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      {isLoading && <p className="text-xs text-muted-foreground mt-2">AI is thinking...</p>}
      {threadId && (
        <p className="text-xs text-muted-foreground mt-2">Thread ID: {threadId.substring(0, 8)}...</p>
      )}
    </div>
  );
};

export default ChatInputArea;
