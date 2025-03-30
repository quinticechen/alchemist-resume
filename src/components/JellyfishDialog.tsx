
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import JellyfishAnimation from "@/components/JellyfishAnimation";

interface JellyfishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: string;
}

const JellyfishDialog: React.FC<JellyfishDialogProps> = ({ 
  open, 
  onOpenChange, 
  title = "Resume Alchemist Says...", 
  message 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-start gap-4 pt-2">
          <div className="flex-shrink-0">
            <JellyfishAnimation width={100} height={100} />
          </div>
          <div className="text-sm text-gray-700 flex-grow">
            <p className="leading-relaxed">{message}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JellyfishDialog;
