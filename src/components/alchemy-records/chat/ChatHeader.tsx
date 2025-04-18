
import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Wand2 } from "lucide-react";

interface ChatHeaderProps {
  onOptimizeClick: () => void;
  onToggleChat: () => void;
  showChat: boolean;
  disabled?: boolean;
  CustomAnimation: React.ComponentType<any>;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  onOptimizeClick, 
  onToggleChat, 
  showChat, 
  disabled,
  CustomAnimation
}) => {
  return (
    <CardHeader className="border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CustomAnimation width={50} height={50} />
          <CardTitle className="text-lg">
            {showChat ? "Chat with AI Assistant" : "AI Assistant"}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOptimizeClick}
            disabled={disabled}
            className="hidden md:flex items-center gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Optimize Section
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleChat}
          >
            {showChat ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};

export default ChatHeader;
