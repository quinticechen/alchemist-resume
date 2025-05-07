
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformContentModal } from "./PlatformContentModal";
import { ExternalLink } from "lucide-react";

interface ContentBlock {
  type: string;
  text: string;
  content?: ContentBlock[];
  url?: string;
  annotations?: any[];
  is_list_item?: boolean;
  list_type?: 'bulleted_list' | 'numbered_list';
  media_type?: string;
  media_url?: string;
}

interface PlatformCardProps {
  name: string;
  url: string;
  description?: string;
  content?: ContentBlock[];
  logoUrl?: string; // Add logoUrl prop
}

export const PlatformCard = ({ 
  name, 
  url, 
  description, 
  content = [],
  logoUrl 
}: PlatformCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const processedUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;

  return (
    <>
      <Card 
        className="hover:shadow-lg transition-shadow overflow-hidden cursor-pointer flex flex-col"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Logo Section */}
        {logoUrl && (
          <div className="flex justify-center p-4 border-b">
            <img 
              src={logoUrl} 
              alt={`${name} logo`} 
              className="h-16 object-contain" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <a 
              href={processedUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              {name}
              <ExternalLink className="h-3 w-3 inline-block ml-1" />
            </a>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-grow">
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>
          )}
        </CardContent>
      </Card>

      <PlatformContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={name}
        content={content}
        url={processedUrl}
        logoUrl={logoUrl}
      />
    </>
  );
};
