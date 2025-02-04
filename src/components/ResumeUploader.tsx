import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UploadZone from "./upload/UploadZone";
import { useResumeUpload } from "./upload/useResumeUpload";
import { useResumeAnalysis } from "./upload/useResumeAnalysis";

interface ResumeUploaderProps {
  onUploadSuccess: (file: File, path: string, url: string, id: string) => void;
  onFileUpload?: (file: File, filePath: string, publicUrl: string, id: string) => void;
}

const ResumeUploader = ({ onUploadSuccess, onFileUpload }: ResumeUploaderProps) => {
  const { isUploading, uploadFile } = useResumeUpload(onUploadSuccess || onFileUpload);
  useResumeAnalysis();

  return (
    <Card className="w-full border-neutral-200 shadow-apple hover:shadow-apple-lg transition-shadow duration-300">
      <CardHeader className="border-b border-neutral-200 bg-neutral-50">
        <CardTitle className="text-xl font-semibold text-neutral-800">Upload Your Resume</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <UploadZone 
          isUploading={isUploading}
          onFileSelect={uploadFile}
        />
      </CardContent>
    </Card>
  );
};

export default ResumeUploader;