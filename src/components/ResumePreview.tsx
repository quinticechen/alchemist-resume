import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResumePreviewProps {
  file: File | null;
}

const ResumePreview = ({ file }: ResumePreviewProps) => {
  if (!file) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Resume Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-secondary p-4 rounded-lg">
          <p className="text-sm text-gray-600">Selected file: {file.name}</p>
          {/* In a full implementation, we would render a PDF preview here */}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumePreview;