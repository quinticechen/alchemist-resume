import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UploadZone from "./upload/UploadZone";
import { useResumeUpload } from "./upload/useResumeUpload";
import { useResumeAnalysis } from "./upload/useResumeAnalysis";

interface ResumeUploaderProps {
  onFileUpload: (file: File, filePath: string, publicUrl: string, id: string) => void;
}

const ResumeUploader = ({ onFileUpload }: ResumeUploaderProps) => {
  const { isUploading, uploadFile } = useResumeUpload(onFileUpload);
  useResumeAnalysis();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Your Resume</CardTitle>
      </CardHeader>
      <CardContent>
        <UploadZone 
          isUploading={isUploading}
          onFileSelect={uploadFile}
        />
      </CardContent>
    </Card>
  );
};

export default ResumeUploader;