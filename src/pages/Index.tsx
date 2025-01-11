import React, { useState } from "react";
import ResumeUploader from "@/components/ResumeUploader";
import JobUrlInput from "@/components/JobUrlInput";
import ResumePreview from "@/components/ResumePreview";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string>();
  const [publicUrl, setPublicUrl] = useState<string>();
  const { toast } = useToast();

  const handleFileUpload = (file: File, path: string, url: string) => {
    console.log("File uploaded:", file.name, "Path:", path, "Public URL:", url);
    setSelectedFile(file);
    setFilePath(path);
    setPublicUrl(url);
    toast({
      title: "Resume Uploaded",
      description: `Successfully uploaded ${file.name}`,
    });
  };

  const handleUrlSubmit = (url: string) => {
    console.log("Job URL submitted:", url);
    toast({
      title: "Job URL Submitted",
      description: "Successfully submitted job URL for analysis",
    });
    // Here we would implement the job analysis logic
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8">
        <div className="container max-w-4xl mx-auto space-y-8 animate-fade-up">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary mb-2">
              Resume Matcher
            </h1>
            <p className="text-gray-600">
              Upload your resume and job posting to get a customized match
            </p>
          </div>

          <div className="grid gap-8">
            <ResumeUploader onFileUpload={handleFileUpload} />
            <ResumePreview 
              file={selectedFile} 
              filePath={filePath}
              publicUrl={publicUrl}
            />
            <JobUrlInput onUrlSubmit={handleUrlSubmit} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;