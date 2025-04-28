
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface Platform {
  id: string;
  url: string;
  attrs: any;
  content?: {
    title: string;
    description: string;
    content: string;
  };
}

interface PlatformCardProps {
  platform: Platform;
  onViewContent: (content: string) => void;
}

export const PlatformCard = ({ platform, onViewContent }: PlatformCardProps) => {
  const title = platform.content?.title || platform.attrs?.title || 'Untitled';
  const description = platform.content?.description || platform.attrs?.description;
  const url = platform.content?.url || platform.url;

  const handleCardClick = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        
        {platform.content?.content && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onViewContent(platform.content?.content || '');
            }}
          >
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
