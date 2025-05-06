
import React from 'react';
import { Lightbulb, Search, MessageSquare, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PromptGuide {
  text: string;
  shortText: string;
  icon: React.ReactNode;
}

interface PromptGuidesProps {
  onPromptSelect: (text: string) => void;
  isDisabled: boolean;
}

const promptGuides: PromptGuide[] = [
  {
    text: "What are the most attractive highlights in this resume?",
    shortText: "Resume highlights?",
    icon: <Lightbulb className="h-4 w-4" />
  },
  {
    text: "Which keywords could we strengthen?",
    shortText: "Keywords to strengthen?",
    icon: <Search className="h-4 w-4" />
  },
  {
    text: "How can we make your experience more compelling?",
    shortText: "Improve experience?",
    icon: <MessageSquare className="h-4 w-4" />
  },
  {
    text: "What questions might interviewers ask?",
    shortText: "Interview questions?",
    icon: <HelpCircle className="h-4 w-4" />
  }
];

const PromptGuides: React.FC<PromptGuidesProps> = ({ onPromptSelect, isDisabled }) => {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {promptGuides.map((prompt, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="text-xs flex-shrink-0"
          onClick={() => onPromptSelect(prompt.text)}
          disabled={isDisabled}
        >
          {prompt.icon}
          <span className="ml-1 hidden sm:inline">{prompt.text}</span>
          <span className="ml-1 sm:hidden">{prompt.shortText}</span>
        </Button>
      ))}
    </div>
  );
};

export default PromptGuides;
