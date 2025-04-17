
import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import { useJellyfishDialog } from "@/hooks/use-jellyfish-dialog";
import JellyfishButton from "./ooze/JellyfishButton";
import JellyfishTipDialog from "./ooze/JellyfishTipDialog";
import JellyfishChatSheet from "./ooze/JellyfishChatSheet";

interface JellyfishDialogProps {
  className?: string;
  title?: string;
  position?: "top" | "middle" | "bottom";
  currentSectionId?: string;
  onSuggestionApply?: (text: string, sectionId: string) => void;
  onGenerateSuggestion?: (sectionId: string) => void;
  simpleTipMode?: boolean;
  jobData?: any;
}

const JellyfishDialog: React.FC<JellyfishDialogProps> = ({ 
  className = "",
  title = "Resume Assistant",
  position = "middle",
  currentSectionId = "",
  onSuggestionApply,
  onGenerateSuggestion,
  simpleTipMode = false,
  jobData = null
}) => {
  const dialogDescriptionId = "jellyfishDialogDescription";
  const sheetDescriptionId = "jellyfishSheetDescription";
  
  // Use the custom hook to manage the dialog state and chat functionality
  const {
    // State
    isDialogOpen,
    isSheetOpen,
    message,
    inputValue,
    chats,
    isLoading,
    isRetrying,
    apiError,
    currentThreadId,
    analysisId,
    messagesEndRef,
    
    // Actions
    setIsDialogOpen,
    setIsSheetOpen,
    setInputValue,
    handleOpenDialog,
    handleSendMessage,
    handleKeyDown,
    handleGenerateSuggestion,
    handleRetry,
    handleApplySuggestion
  } = useJellyfishDialog({
    simpleTipMode,
    currentSectionId,
    onGenerateSuggestion,
    onSuggestionApply,
    jobData
  });

  const dialogTitle = simpleTipMode ? "Alchemy Ooze" : "Resume Assistant";

  const handleOpenChat = () => {
    setIsDialogOpen(false);
    setIsSheetOpen(true);
  };

  return (
    <>
      {/* Jellyfish Button */}
      <JellyfishButton 
        onClick={handleOpenDialog} 
        position={position} 
        className={className}
        simpleTipMode={simpleTipMode} 
      />

      {/* Tip Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <JellyfishTipDialog
          title={dialogTitle}
          message={message}
          onClose={() => setIsDialogOpen(false)}
          onOpenChat={handleOpenChat}
          showChatButton={!simpleTipMode}
          dialogDescriptionId={dialogDescriptionId}
        />
      </Dialog>

      {/* Chat Sheet */}
      {!simpleTipMode && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <JellyfishChatSheet
            chats={chats}
            inputValue={inputValue}
            isLoading={isLoading}
            isRetrying={isRetrying}
            apiError={apiError}
            analysisId={analysisId}
            currentThreadId={currentThreadId}
            messagesEndRef={messagesEndRef}
            setInputValue={setInputValue}
            onKeyDown={handleKeyDown}
            onSend={handleSendMessage}
            onGenerateSuggestion={() => currentSectionId && handleGenerateSuggestion()}
            onRetry={handleRetry}
            onApplySuggestion={(suggestion) => handleApplySuggestion(suggestion)}
            sheetDescriptionId={sheetDescriptionId}
          />
        </Sheet>
      )}
    </>
  );
};

export default JellyfishDialog;
