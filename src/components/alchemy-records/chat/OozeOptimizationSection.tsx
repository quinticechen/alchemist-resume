
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOozeOptimization } from "@/hooks/use-ooze-optimization";
import ChatInputArea from './ChatInputArea';
import MessageList from './MessageList';
import ChatStateDisplay from './ChatStateDisplay';
import PromptGuides from './PromptGuides';
import { OptimizationProps } from './types';
import { useTranslation } from "react-i18next";

const OozeOptimizationSection: React.FC<OptimizationProps> = ({ optimizationData, analysisId }) => {
  const { t } = useTranslation(['resume-refine']);
  const {
    messages,
    input,
    isLoading,
    threadId,
    debugInfo,
    initializationStatus,
    messagesEndRef,
    setInput,
    handleSendMessage,
    handleKeyDown,
    handleRetryInitialization,
    handlePromptSelect
  } = useOozeOptimization(analysisId);

  return (
    <Card className="h-full flex flex-col border-none shadow-none">
      {debugInfo ? (
        <div className="flex-1 overflow-auto bg-slate-100 p-4 rounded text-xs font-mono">
          <pre>{debugInfo}</pre>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {initializationStatus === 'loading' || initializationStatus === 'error' ? (
            <ChatStateDisplay 
              state={initializationStatus} 
              onRetry={handleRetryInitialization}
            />
          ) : (
            <div className="flex flex-col h-full">
              {/* Scrollable chat messages area */}
              <div className="flex-grow overflow-hidden">
                <MessageList 
                  messages={messages} 
                  analysisId={analysisId} 
                  messagesEndRef={messagesEndRef}
                  className="h-full pr-4"
                />
              </div>
              
              {/* Chat input stays at the bottom */}
              <div className="mt-auto bg-white sticky bottom-0">
                <ChatInputArea 
                  input={input}
                  setInput={setInput}
                  handleKeyDown={handleKeyDown}
                  handleSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  threadId={threadId}
                  isDisabled={isLoading || !analysisId || initializationStatus !== 'success'}
                />
              </div>
            </div>
          )}
          
          {initializationStatus === 'error' && (
            <div className="flex justify-end mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetryInitialization}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default OozeOptimizationSection;
