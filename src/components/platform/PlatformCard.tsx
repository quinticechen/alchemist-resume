
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Platform {
  id: string;
  url: string | null;
  title: string;
  description: string | null;
  content: string | null;
  notion_url: string | null;
}

interface PlatformCardProps {
  platform: Platform;
  onViewContent: (content: string) => void;
}

export const PlatformCard = ({ platform, onViewContent }: PlatformCardProps) => {
  const url = platform.url || platform.notion_url;

  const handleCardClick = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (platform.content) {
      onViewContent(platform.content);
    }
  };

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">{platform.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {platform.description && (
          <p className="text-sm text-muted-foreground">{platform.description}</p>
        )}

        {platform.content && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleViewDetails}
          >
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
