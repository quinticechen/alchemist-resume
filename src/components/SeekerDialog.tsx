
import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import { useSeekerDialog } from "@/hooks/use-seeker-dialog";
import SeekerButton from "./seeker/SeekerButton";
import SeekerTipDialog from "./seeker/SeekerTipDialog";
import SeekerChatSheet from "./seeker/SeekerChatSheet";

export interface SeekerDialogProps {
  className?: string;
  position?: "top" | "middle" | "bottom";
  simpleTipMode?: boolean;
  title?: string;
}

const SeekerDialog: React.FC<SeekerDialogProps> = ({ 
  className = "",
  position = "middle",
  simpleTipMode = false,
  title = "Seeker Support"
}) => {
  const dialogDescriptionId = "SeekerDialogDescription";
  const sheetDescriptionId = "SeekerSheetDescription";
  
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
    resumeEditMode: false,
  });

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
          title={title}
          message={message}
          onClose={() => setIsDialogOpen(false)}
          onOpenChat={handleOpenChat}
          showChatButton={true}
          dialogDescriptionId={dialogDescriptionId}
        />
      </Dialog>

      {/* Chat Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SeekerChatSheet
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

export default SeekerDialog;
