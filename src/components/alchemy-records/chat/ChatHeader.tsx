
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown, Zap } from "lucide-react";

interface ChatHeaderProps {
  onOptimizeClick: () => void;
  onToggleChat: () => void;
  showChat: boolean;
  disabled?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  onOptimizeClick, 
  onToggleChat, 
  showChat,
  disabled = false
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <h3 className="text-lg font-semibold">AI Resume Assistant</h3>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOptimizeClick}
          title="Optimize current section"
          className="flex items-center gap-1"
          disabled={disabled}
        >
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">Optimize</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onToggleChat}
          aria-label={showChat ? "Collapse chat" : "Expand chat"}
        >
          <ChevronDown className={`h-5 w-5 transition-transform ${showChat ? '' : 'transform rotate-180'}`} />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
