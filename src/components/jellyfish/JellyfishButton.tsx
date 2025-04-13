
import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import JellyfishAnimation from "@/components/JellyfishAnimation";
import { useIsMobile } from "@/hooks/use-mobile";

interface JellyfishButtonProps {
  onClick: () => void;
  position: "top" | "middle" | "bottom";
  className?: string;
  simpleTipMode: boolean;
  showChatBubble?: boolean;
  chatMessage?: string;
}

const JellyfishButton: React.FC<JellyfishButtonProps> = ({ 
  onClick, 
  position, 
  className = "", 
  simpleTipMode,
  showChatBubble = false,
  chatMessage = ""
}) => {
  const isMobile = useIsMobile();
  
  const positionClasses = {
    top: "top-24",
    middle: "top-1/2 -translate-y-1/2",
    bottom: "bottom-24"
  };

  return (
    <div className={`fixed right-6 ${positionClasses[position]} z-50 ${className}`}>
      {showChatBubble && (
        <div className="absolute -left-64 top-1/2 transform -translate-y-1/2 bg-white rounded-2xl p-4 shadow-sm border border-neutral-200 w-60">
          <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 rotate-45 w-4 h-4 bg-white border-t border-r border-neutral-200"></div>
          <p className="text-sm font-medium text-neutral-800 relative z-10">
            {chatMessage}
          </p>
        </div>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className="hover:bg-transparent p-0 h-auto w-auto relative group"
      >
        <div className="absolute -top-10 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background text-xs p-2 rounded shadow whitespace-nowrap">
          {simpleTipMode ? "View Resume Tip" : "Chat with Alchemy Ooze"}
        </div>
        <JellyfishAnimation 
          width={100} 
          height={100} 
          mobileWidth={80}
          mobileHeight={80}
        />
        {!simpleTipMode && (
          <MessageCircle className="absolute bottom-6 right-6 bg-primary text-primary-foreground rounded-full p-1 h-6 w-6 animate-pulse" />
        )}
      </Button>
    </div>
  );
};

export default JellyfishButton;
