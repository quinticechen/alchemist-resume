import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye } from "lucide-react";

interface ResumePreviewProps {
  file: File | null;
  filePath?: string;
  publicUrl?: string;
}

const ResumePreview = ({ file, filePath, publicUrl }: ResumePreviewProps) => {
  if (!file || !publicUrl) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Resume Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-secondary p-4 rounded-lg space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            <p className="text-sm text-gray-600">{file.name}</p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(publicUrl, '_blank')}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumePreview;