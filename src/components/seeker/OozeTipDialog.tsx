
import React, { useState } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface OozeTipDialogProps {
  title: string;
  message: string;
  onClose: () => void;
  onOpenChat: () => void;
  resumeEditMode: boolean;
  dialogDescriptionId: string;
}

const OozeTipDialog: React.FC<OozeTipDialogProps> = ({
  title,
  message,
  onClose,
  onOpenChat,
  resumeEditMode,
  dialogDescriptionId
}) => {
  const [isQuestionsExpanded, setIsQuestionsExpanded] = useState(false);

  const defaultQuestions = [
    "What are the most attractive highlights in this resume?",
    "Which keywords could we strengthen?",
    "How can we make your experience more compelling?",
    "What questions might interviewers ask?"
  ];

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">O</span>
          </div>
          {title}
        </DialogTitle>
        <DialogDescription id={dialogDescriptionId}>
          {message}
        </DialogDescription>
      </DialogHeader>

      {resumeEditMode && (
        <div className="space-y-4">
          <Collapsible open={isQuestionsExpanded} onOpenChange={setIsQuestionsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>Default Questions</span>
                {isQuestionsExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {defaultQuestions.map((question, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-700">{question}</p>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Close
        </Button>
        <Button onClick={onOpenChat} className="flex-1 bg-gradient-primary text-white">
          <MessageCircle className="h-4 w-4 mr-2" />
          Open Chat
        </Button>
      </div>
    </DialogContent>
  );
};

export default OozeTipDialog;
