
import React from 'react';
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import OozeAnimation from "@/components/OozeAnimation";

interface ChatStateDisplayProps {
  state: 'loading' | 'error' | 'idle' | 'success';
  onRetry: () => void;
}

const ChatStateDisplay: React.FC<ChatStateDisplayProps> = ({ state, onRetry }) => {
  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <OozeAnimation width={120} height={120} />
        <p className="text-sm text-muted-foreground mt-4">Loading assistant...</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Connection Error</h3>
        <p className="text-center text-muted-foreground mb-4">
          Could not connect to the AI assistant. 
          Please check your connection and try again.
        </p>
        <Button onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Connection
        </Button>
      </div>
    );
  }

  return null;
};

export default ChatStateDisplay;
