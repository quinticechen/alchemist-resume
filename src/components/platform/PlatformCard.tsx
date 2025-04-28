
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlatformCardProps {
  name: string;
  url: string;
  description?: string;
  attrs: any;
}

export const PlatformCard = ({ name, url, description, attrs }: PlatformCardProps) => {
  // Filter out specific properties we don't want to display in the properties list
  const filteredAttrs = { ...attrs };
  const excludedProperties = ['title', 'description', 'notionUrl'];
  excludedProperties.forEach(prop => {
    delete filteredAttrs[prop];
  });

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>{name}</span>
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${name}`}>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </CardTitle>
        {url && (
          <CardDescription className="truncate">
            <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {url}
            </a>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        
        {Object.keys(filteredAttrs).length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Details</h4>
            <dl className="space-y-1">
              {Object.entries(filteredAttrs).map(([key, value]) => (
                value && typeof value !== 'object' && (
                  <div key={key} className="grid grid-cols-3 text-sm">
                    <dt className="font-medium text-gray-500 col-span-1">{key}:</dt>
                    <dd className="col-span-2">{String(value)}</dd>
                  </div>
                )
              ))}
            </dl>
          </div>
        )}
        
        {attrs?.notionUrl && (
          <div className="pt-2 text-xs">
            <a 
              href={attrs.notionUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View in Notion</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
