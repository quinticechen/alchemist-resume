import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface ResumePreviewProps {
  file: File | null;
  filePath?: string;
}

const ResumePreview = ({ file, filePath }: ResumePreviewProps) => {
  if (!file) return null;

  const downloadResume = async () => {
    if (!filePath) return;

    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .download(filePath);

      if (error) {
        throw error;
      }

      // Create a URL for the downloaded file
      const url = URL.createObjectURL(data);
      
      // Create a temporary link element and trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading resume:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Resume Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-secondary p-4 rounded-lg">
          <p className="text-sm text-gray-600">Selected file: {file.name}</p>
          <button
            onClick={downloadResume}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Download Resume
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumePreview;