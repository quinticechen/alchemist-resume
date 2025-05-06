
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OozeAnimation from "@/components/OozeAnimation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOozeOptimization } from "@/hooks/use-ooze-optimization";
import ChatInputArea from './chat/ChatInputArea';
import MessageList from './chat/MessageList';
import ChatStateDisplay from './chat/ChatStateDisplay';
import { OptimizationProps } from './chat/types';

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
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader className="p-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <OozeAnimation width={18} height={18} />
          Ooze Optimization
          {initializationStatus === 'error' && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={handleRetryInitialization}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 overflow-hidden p-3">
        {debugInfo ? (
          <div className="flex-1 overflow-auto bg-slate-100 p-4 rounded text-xs font-mono">
            <pre>{debugInfo}</pre>
          </div>
        ) : initializationStatus === 'loading' || initializationStatus === 'error' ? (
          <ChatStateDisplay 
            state={initializationStatus} 
            onRetry={handleRetryInitialization}
          />
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex justify-center mb-4">
              <OozeAnimation width={80} height={80} />
            </div>
            
            <MessageList 
              messages={messages} 
              analysisId={analysisId} 
              messagesEndRef={messagesEndRef}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OozeOptimizationSection;
