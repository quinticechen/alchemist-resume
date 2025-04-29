
import React, { useState, useRef } from 'react';
import { useAIChat } from "@/hooks/use-ai-chat";
import ChatHeader from "./chat/ChatHeader";
import ChatMessageList from "./chat/ChatMessageList";
import ChatInput from "./chat/ChatInput";
import OozeAnimation from "@/components/OozeAnimation";

interface AIChatInterfaceProps {
  resumeId: string;
  analysisId: string;
  onSuggestionApply: (text: string, sectionId: string) => void;
  currentSectionId: string;
  currentSectionContent?: string;
}

const AIChatInterface: React.FC<AIChatInterfaceProps> = ({ 
  resumeId, 
  analysisId,
  onSuggestionApply,
  currentSectionId,
  currentSectionContent
}) => {
  const [showChat, setShowChat] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dialogDescriptionId = "aiChatInterfaceDescription";
  
  const {
    messages,
    input,
    isLoading,
    apiError,
    effectiveAnalysisId,
    currentThreadId,
    threadMetadata,
    messagesEndRef,
    guidanceForOptimization,
    setInput,
    handleSendMessage,
    handleKeyDown,
    handleApplySuggestion,
    handleOptimizeCurrentSection,
    handlePromptSelect
  } = useAIChat(
    resumeId,
    analysisId,
    currentSectionId,
    currentSectionContent,
    onSuggestionApply
  );

  return (
    <div className="relative rounded-xl bg-white shadow-apple h-full">
      <ChatHeader 
        CustomAnimation={OozeAnimation}
        title="Ooze Instruction"
        onOptimizeClick={() => {
          handleOptimizeCurrentSection();
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }}
        onToggleChat={() => setShowChat(!showChat)} 
        showChat={showChat}
        disabled={!effectiveAnalysisId}
      />
      
      {showChat && (
        <>
          <ChatMessageList
            messages={messages}
            apiError={apiError}
            effectiveAnalysisId={effectiveAnalysisId}
            messagesEndRef={messagesEndRef}
            onApplySuggestion={handleApplySuggestion}
            dialogDescriptionId={dialogDescriptionId}
            guidanceForOptimization={guidanceForOptimization}
          />
          
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onSend={handleSendMessage}
            isLoading={isLoading}
            disabled={!effectiveAnalysisId}
            inputRef={inputRef}
            dialogDescriptionId={dialogDescriptionId}
            threadMetadata={threadMetadata}
            analysisId={effectiveAnalysisId}
            onPromptSelect={handlePromptSelect}
          />
        </>
      )}
    </div>
  );
};

export default AIChatInterface;
