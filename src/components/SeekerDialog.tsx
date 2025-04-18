
import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import { useSeekerDialog } from "@/hooks/use-seeker-dialog";
import SeekerButton from "./seeker/SeekerButton";
import SeekerTipDialog from "./seeker/SeekerTipDialog";
import SeekerChatSheet from "./seeker/SeekerChatSheet";

interface SeekerDialogProps {
  className?: string;
  title?: string;
  position?: "top" | "middle" | "bottom";
  currentSectionId?: string;
  onSuggestionApply?: (text: string, sectionId: string) => void;
  onGenerateSuggestion?: (sectionId: string) => void;
  simpleTipMode?: boolean;
  jobData?: any;
}

const SeekerDialog: React.FC<SeekerDialogProps> = ({ 
  className = "",
  title = "Resume Assistant",
  position = "middle",
  currentSectionId = "",
  onSuggestionApply,
  onGenerateSuggestion,
  simpleTipMode = false,
  jobData = null
}) => {
  const dialogDescriptionId = "SeekerDialogDescription";
  const sheetDescriptionId = "SeekerSheetDescription";
  
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
  } = useSeekerDialog({
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
      {/* Seeker Button */}
      <SeekerButton 
        onClick={handleOpenDialog} 
        position={position} 
        className={className}
        simpleTipMode={simpleTipMode}
      />

      {/* Tip Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <SeekerTipDialog
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
          <SeekerChatSheet
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

export default SeekerDialog;
