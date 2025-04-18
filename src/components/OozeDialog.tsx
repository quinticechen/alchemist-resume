
import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import { useSeekerDialog } from "@/hooks/use-seeker-dialog";
import OozeButton from "./seeker/OozeButton";
import OozeTipDialog from "./seeker/OozeTipDialog";
import OozeChatSheet from "./seeker/OozeChatSheet";

export interface OozeDialogProps {
  className?: string;
  position?: "top" | "middle" | "bottom";
  resumeEditMode?: boolean;
  title?: string;
  onSuggestionApply?: (text: string, sectionId: string) => void;
  onGenerateSuggestion?: (sectionId: string) => void;
  jobData?: any;
  currentSectionId?: string;
}

const OozeDialog: React.FC<OozeDialogProps> = ({ 
  className = "",
  position = "middle",
  resumeEditMode = true,
  title = "Resume Alchemist",
  onSuggestionApply,
  onGenerateSuggestion,
  jobData,
  currentSectionId
}) => {
  const dialogDescriptionId = "OozeDialogDescription";
  const sheetDescriptionId = "OozeSheetDescription";
  
  const {
    // State
    isDialogOpen,
    isSheetOpen,
    message,
    inputValue,
    chats,
    isLoading,
    apiError,
    messagesEndRef,
    
    // Actions
    setIsDialogOpen,
    setIsSheetOpen,
    setInputValue,
    handleOpenDialog,
    handleSendMessage,
    handleKeyDown
  } = useSeekerDialog({
    resumeEditMode,
    jobData,
    currentSectionId,
    onSuggestionApply,
    onGenerateSuggestion
  });

  const handleOpenChat = () => {
    setIsDialogOpen(false);
    setIsSheetOpen(true);
  };

  return (
    <>
      {/* Ooze Button */}
      <OozeButton 
        onClick={handleOpenDialog} 
        position={position} 
        className={className}
        resumeEditMode={resumeEditMode}
      />

      {/* Tip Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <OozeTipDialog
          title={title}
          message={message}
          onClose={() => setIsDialogOpen(false)}
          onOpenChat={handleOpenChat}
          resumeEditMode={resumeEditMode}
          dialogDescriptionId={dialogDescriptionId}
        />
      </Dialog>

      {/* Chat Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <OozeChatSheet
          chats={chats}
          inputValue={inputValue}
          isLoading={isLoading}
          apiError={apiError}
          messagesEndRef={messagesEndRef}
          setInputValue={setInputValue}
          onKeyDown={handleKeyDown}
          onSend={handleSendMessage}
          sheetDescriptionId={sheetDescriptionId}
        />
      </Sheet>
    </>
  );
};

export default OozeDialog;
