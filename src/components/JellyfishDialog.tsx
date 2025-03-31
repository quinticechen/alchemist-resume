
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import JellyfishAnimation from "@/components/JellyfishAnimation";
import { MessageCircle } from "lucide-react";

interface JellyfishDialogProps {
  className?: string;
  title?: string;
  position?: "top" | "middle" | "bottom";
}

const messages = [
  "Transforming your resume into something incredible!",
  "Optimizing your career potential one word at a time!",
  "Your perfect job is waiting - let's make sure your resume gets noticed!",
  "Adding a splash of brilliance to your professional story!",
  "Remember, a great resume is an investment in your future!",
  "Stand out from the crowd with a tailored resume that shines!",
  "Success is waiting for you - let's make your resume work harder!"
];

const JellyfishDialog: React.FC<JellyfishDialogProps> = ({ 
  className = "",
  title = "Jellyfish Tips",
  position = "middle"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const getRandomMessage = () => {
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  };

  const handleOpenDialog = () => {
    setMessage(getRandomMessage());
    setIsOpen(true);
  };

  const positionClasses = {
    top: "top-24",
    middle: "top-1/2 -translate-y-1/2",
    bottom: "bottom-24"
  };

  return (
    <>
      <div className={`fixed right-6 ${positionClasses[position]} z-50 ${className}`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenDialog}
          className="hover:bg-transparent p-0 h-auto w-auto relative group"
        >
          <div className="absolute -top-10 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background text-xs p-2 rounded shadow whitespace-nowrap">
            Click for Jellyfish Tips!
          </div>
          <JellyfishAnimation width={120} height={120} />
          <MessageCircle className="absolute bottom-6 right-6 bg-primary text-primary-foreground rounded-full p-1 h-6 w-6 animate-pulse" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <JellyfishAnimation width={150} height={150} />
            <p className="text-center text-lg font-medium text-primary">{message}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JellyfishDialog;
