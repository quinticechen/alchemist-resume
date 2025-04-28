
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface PlatformContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: Array<{ type: string; text: string }>;
  url: string;
}

export const PlatformContentModal = ({
  isOpen,
  onClose,
  title,
  content,
  url,
}: PlatformContentModalProps) => {
  const renderContent = (content: Array<{ type: string; text: string }>) => {
    return content.map((block, index) => {
      switch (block.type) {
        case 'heading_1':
          return <h1 key={index} className="text-2xl font-bold mb-4">{block.text}</h1>;
        case 'heading_2':
          return <h2 key={index} className="text-xl font-semibold mb-3">{block.text}</h2>;
        case 'heading_3':
          return <h3 key={index} className="text-lg font-medium mb-2">{block.text}</h3>;
        case 'paragraph':
          return <p key={index} className="mb-4 text-gray-600">{block.text}</p>;
        default:
          return <p key={index} className="mb-4 text-gray-600">{block.text}</p>;
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {content && renderContent(content)}
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => window.open(url, '_blank')} className="gap-2">
            Find Jobs
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
