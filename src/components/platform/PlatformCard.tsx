
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformContentModal } from "./PlatformContentModal";

interface PlatformCardProps {
  name: string;
  url: string;
  description?: string;
  content?: Array<{ type: string; text: string }>;
}

export const PlatformCard = ({ name, url, description, content = [] }: PlatformCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card 
        className="hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <a 
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:text-blue-600 transition-colors"
            >
              {name}
            </a>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardContent>
      </Card>

      <PlatformContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={name}
        content={content}
        url={url}
      />
    </>
  );
};
