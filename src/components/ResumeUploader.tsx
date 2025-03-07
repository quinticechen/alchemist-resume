
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UploadZone from "./upload/UploadZone";
import { useResumeUpload } from "./upload/useResumeUpload";
import { useResumeAnalysis } from "./upload/useResumeAnalysis";
import { Button } from "@/components/ui/button";
import { FileText, Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ResumeUploaderProps {
  onUploadSuccess: (file: File, path: string, url: string, id: string) => void;
  onFileUpload?: (file: File, filePath: string, publicUrl: string, id: string) => void;
}

const ResumeUploader = ({ onUploadSuccess, onFileUpload }: ResumeUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumePath, setResumePath] = useState<string>("");
  const { isUploading, uploadFile } = useResumeUpload((file, path, url, id) => {
    setSelectedFile(file);
    setResumePath(path);
    if (onUploadSuccess) onUploadSuccess(file, path, url, id);
    if (onFileUpload) onFileUpload(file, path, url, id);
  });
  useResumeAnalysis();

  const previewResume = () => {
    if (resumePath) {
      const { data } = supabase.storage
        .from('resumes')
        .getPublicUrl(resumePath);
      window.open(data.publicUrl, '_blank');
    }
  };

  const removeResume = () => {
    setSelectedFile(null);
    setResumePath("");
  };

  const handleFileSelect = (file: File) => {
    if (selectedFile) {
      // User needs to remove current resume first
      return;
    }
    uploadFile(file);
  };

  return (
    <Card className="w-full border-neutral-200 shadow-apple hover:shadow-apple-lg transition-shadow duration-300">
      <CardHeader className="border-b border-neutral-200 bg-neutral-50">
        <CardTitle className="text-xl font-semibold text-neutral-800">Upload Your Resume</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {selectedFile ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={previewResume}
                className="text-primary border-primary/20 hover:bg-primary/5 flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Preview Resume
              </Button>
              <Button
                variant="outline"
                onClick={removeResume}
                className="text-red-500 border-red-200 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <UploadZone 
            isUploading={isUploading}
            onFileSelect={handleFileSelect}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ResumeUploader;
