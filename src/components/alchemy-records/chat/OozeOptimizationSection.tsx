
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import OozeAnimation from "@/components/OozeAnimation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOozeOptimization } from "@/hooks/use-ooze-optimization";
import ChatInputArea from './ChatInputArea';
import MessageList from './MessageList';
import ChatStateDisplay from './ChatStateDisplay';
import PromptGuides from './PromptGuides';
import { OptimizationProps } from './types';

const OozeOptimizationSection: React.FC<OptimizationProps> = ({ optimizationData, analysisId }) => {
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
    <Card className="h-full overflow-hidden flex flex-col border-none shadow-none">
      {debugInfo ? (
        <div className="flex-1 overflow-auto bg-slate-100 p-4 rounded text-xs font-mono">
          <pre>{debugInfo}</pre>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex justify-center mb-2">
            <OozeAnimation width={60} height={60} />
          </div>
          
          {initializationStatus === 'loading' || initializationStatus === 'error' ? (
            <ChatStateDisplay 
              state={initializationStatus} 
              onRetry={handleRetryInitialization}
            />
          ) : (
            <>
              <MessageList 
                messages={messages} 
                analysisId={analysisId} 
                messagesEndRef={messagesEndRef}
              />
              
              <PromptGuides
                onPromptSelect={handlePromptSelect}
                isDisabled={isLoading || !analysisId || initializationStatus !== 'success'}
              />
              
              <ChatInputArea 
                input={input}
                setInput={setInput}
                handleKeyDown={handleKeyDown}
                handleSendMessage={handleSendMessage}
                isLoading={isLoading}
                threadId={threadId}
                isDisabled={isLoading || !analysisId || initializationStatus !== 'success'}
              />
            </>
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
