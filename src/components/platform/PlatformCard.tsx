
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlatformCardProps {
  name: string;
  url: string;
  attrs: any;
}

export const PlatformCard = ({ name, url, attrs }: PlatformCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {url}
          </a>
        </p>
        {attrs && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Properties:</h4>
            <dl className="space-y-2">
              {Object.entries(attrs).map(([key, value]) => (
                <div key={key} className="grid grid-cols-2">
                  <dt className="text-sm font-medium text-gray-500">{key}:</dt>
                  <dd className="text-sm">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
