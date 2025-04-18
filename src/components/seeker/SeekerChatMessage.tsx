
import React from 'react';
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import type { ChatMessage } from "@/hooks/use-seeker-dialog";
import SeekerAnimation from "@/components/SeekerAnimation";

interface SeekerChatMessageProps {
  chat: ChatMessage;
  index: number;
}

const SeekerChatMessage: React.FC<SeekerChatMessageProps> = ({ chat, index }) => {
  const [copied, setCopied] = React.useState(false);
  
  const copyToClipboard = () => {
    if (chat.content) {
      navigator.clipboard.writeText(chat.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleApplySuggestion = () => {
    // This would be implemented in a parent component
    console.log("Apply suggestion:", chat.suggestion, chat.threadId);
  };
  
  if (chat.role === 'user') {
    return (
      <div className="bg-muted/50 p-4 rounded-lg ml-auto max-w-[80%]">
        <p className="text-sm">{chat.content}</p>
      </div>
    );
  }
  
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        <SeekerAnimation width={40} height={40} />
      </div>
      <div className="flex flex-col gap-2 bg-primary/10 p-4 rounded-lg mr-auto max-w-[80%]">
        <p className="text-sm">{chat.content}</p>
        
        {chat.suggestion && chat.threadId && (
          <div className="mt-2 border-t border-primary/20 pt-2">
            <Button 
              size="sm" 
              onClick={handleApplySuggestion}
              className="gap-1"
              variant="outline"
            >
              <Check className="h-3 w-3" />
              Apply suggestion
            </Button>
          </div>
        )}
        
        <div className="flex justify-end mt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-6 w-6 p-0"
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span className="sr-only">Copy message</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SeekerChatMessage;
