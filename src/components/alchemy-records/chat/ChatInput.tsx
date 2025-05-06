
import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Lightbulb, Search, MessageSquare, HelpCircle } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  isLoading: boolean;
  disabled: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  dialogDescriptionId: string;
  threadMetadata?: { thread_id: string } | null;
  analysisId?: string | null;
  onPromptSelect?: (prompt: string) => void;
}

const promptGuides = [
  { 
    text: "What are the most attractive highlights in this resume?",
    shortText: "Resume highlights?",
    icon: <Lightbulb className="h-4 w-4" />
  },
  { 
    text: "Which keywords could we strengthen?",
    shortText: "Keywords to strengthen?",
    icon: <Search className="h-4 w-4" />
  },
  { 
    text: "How can we make your experience more compelling?", 
    shortText: "Improve experience?",
    icon: <MessageSquare className="h-4 w-4" />
  },
  { 
    text: "What questions might interviewers ask?", 
    shortText: "Interview questions?",
    icon: <HelpCircle className="h-4 w-4" />
  }
];

const ChatInput: React.FC<ChatInputProps> = ({ 
  value, 
  onChange, 
  onKeyDown, 
  onSend, 
  isLoading, 
  disabled,
  inputRef,
  dialogDescriptionId,
  threadMetadata,
  analysisId,
  onPromptSelect = () => {}
}) => {
  return (
    <div className="p-4 border-t">
      {/* Prompt guide buttons with responsive text */}
      <div className="mb-3 flex flex-wrap gap-2">
        {promptGuides.map((prompt, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="text-xs flex-shrink-0"
            onClick={() => onPromptSelect(prompt.text)}
            disabled={isLoading || disabled}
          >
            {prompt.icon}
            <span className="ml-1 hidden sm:inline">{prompt.text}</span>
            <span className="ml-1 sm:inline-block md:hidden">{prompt.shortText}</span>
          </Button>
        ))}
      </div>

      <div className="flex gap-2">
        <Textarea
          ref={inputRef}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="Ask for advice on your resume..."
          className="resize-none"
          disabled={isLoading || disabled}
          aria-describedby={dialogDescriptionId}
        />
        <Button 
          onClick={onSend} 
          disabled={isLoading || value.trim() === '' || disabled}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground mt-2">AI is thinking...</p>}
      {analysisId && (
        <div className="text-xs text-muted-foreground mt-2">
          <div>Analysis ID: {analysisId.substring(0, 8)}...</div>
          {threadMetadata && <div>Thread ID: {threadMetadata.thread_id.substring(0, 12)}...</div>}
        </div>
      )}
    </div>
  );
};

export default ChatInput;
