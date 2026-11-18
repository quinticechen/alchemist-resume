
import React from 'react';
import { Lightbulb, Search, MessageSquare, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface PromptGuide {
  textKey: string;
  shortTextKey: string;
  icon: React.ReactNode;
}

interface PromptGuidesProps {
  onPromptSelect: (text: string) => void;
  isDisabled: boolean;
}

const promptGuides: PromptGuide[] = [
  {
    textKey: "aiChat.suggestions.highlights",
    shortTextKey: "Resume highlights?",
    icon: <Lightbulb className="h-4 w-4" />
  },
  {
    textKey: "aiChat.suggestions.keywords",
    shortTextKey: "Keywords to strengthen?",
    icon: <Search className="h-4 w-4" />
  },
  {
    textKey: "aiChat.suggestions.experience",
    shortTextKey: "Improve experience?",
    icon: <MessageSquare className="h-4 w-4" />
  },
  {
    textKey: "aiChat.suggestions.interview",
    shortTextKey: "Interview questions?",
    icon: <HelpCircle className="h-4 w-4" />
  }
];

const PromptGuides: React.FC<PromptGuidesProps> = ({ onPromptSelect, isDisabled }) => {
  const { t } = useTranslation(['resume-refine']);
  
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {promptGuides.map((prompt, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="text-xs flex-shrink-0"
          onClick={() => onPromptSelect(t(prompt.textKey))}
          disabled={isDisabled}
        >
          {prompt.icon}
          <span className="ml-1 hidden sm:inline">{t(prompt.textKey)}</span>
          <span className="ml-1 sm:hidden">{prompt.shortTextKey}</span>
        </Button>
      ))}
    </div>
  );
};

export default PromptGuides;
