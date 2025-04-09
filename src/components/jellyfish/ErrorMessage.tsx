
import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry, 
  isRetrying 
}) => {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <p>{message}</p>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        className="self-end" 
        onClick={onRetry}
        disabled={isRetrying}
      >
        {isRetrying ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Retrying...
          </>
        ) : (
          'Retry'
        )}
      </Button>
    </div>
  );
};

export default ErrorMessage;
