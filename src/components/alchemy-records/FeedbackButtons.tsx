import React from 'react';
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface FeedbackButtonsProps {
  feedback: boolean | null;
  onFeedback: (value: boolean) => void;
}

const FeedbackButtons = ({ feedback, onFeedback }: FeedbackButtonsProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFeedback(true)}
        className={feedback === true ? "text-green-600" : ""}
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFeedback(false)}
        className={feedback === false ? "text-red-600" : ""}
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default FeedbackButtons;