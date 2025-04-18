
import React from 'react';
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import OozeAnimation from "@/components/OozeAnimation";

interface OozeTipDialogProps {
  title: string;
  message: string;
  onClose: () => void;
  onOpenChat?: () => void;
  resumeEditMode?: boolean;
  dialogDescriptionId: string;
}

const OozeTipDialog: React.FC<OozeTipDialogProps> = ({
  title,
  message,
  onClose,
  onOpenChat,
  resumeEditMode = false,
  dialogDescriptionId
}) => {
  return (
    <DialogContent className="sm:max-w-md" aria-describedby={dialogDescriptionId}>
      <DialogHeader>
        <DialogTitle className="text-center">{title}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col items-center gap-4 py-4" id={dialogDescriptionId}>
        <OozeAnimation width={150} height={150} />
        <p className="text-center text-lg font-medium text-primary">{message}</p>
        <div className="flex gap-2 mt-2">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Thanks!
          </Button>
          {onOpenChat && (
            <Button onClick={onOpenChat}>
              Chat with Ooze
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  );
};

export default OozeTipDialog;
