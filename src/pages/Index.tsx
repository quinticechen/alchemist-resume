import React, { useState } from "react";
import ResumeUploader from "@/components/ResumeUploader";
import JobUrlInput from "@/components/JobUrlInput";
import ResumePreview from "@/components/ResumePreview";
import ProcessingPreview from "@/components/ProcessingPreview";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string>();
  const [publicUrl, setPublicUrl] = useState<string>();
  const [resumeId, setResumeId] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (file: File, path: string, url: string, id: string) => {
    console.log("File uploaded:", file.name, "Path:", path, "Public URL:", url, "ID:", id);
    setSelectedFile(file);
    setFilePath(path);
    setPublicUrl(url);
    setResumeId(id);
    toast({
      title: "Resume Uploaded",
      description: `Successfully uploaded ${file.name}`,
    });
  };

  const handleCancelResume = async () => {
    if (filePath) {
      try {
        const { error: storageError } = await supabase.storage
          .from('resumes')
          .remove([filePath]);

        if (storageError) throw storageError;

        setSelectedFile(null);
        setFilePath(undefined);
        setPublicUrl(undefined);
        setResumeId(undefined);
        setIsProcessing(false);

        toast({
          title: "Resume Cancelled",
          description: "Your resume has been removed",
        });
      } catch (error) {
        console.error('Error removing resume:', error);
        toast({
          title: "Error",
          description: "Failed to remove resume",
          variant: "destructive",
        });
      }
    }
  };

  const handleUrlSubmit = async (url: string) => {
    if (!resumeId) {
      toast({
        title: "Error",
        description: "Please upload a resume first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-resume', {
        body: {
          resumeId,
          jobUrl: url,
        },
      });

      if (error) throw error;

      console.log('Processing started:', data);

      toast({
        title: "Analysis Started",
        description: "Your resume is being analyzed. Results will be available soon.",
      });
    } catch (error) {
      console.error('Error processing resume:', error);
      toast({
        title: "Error",
        description: "Failed to process resume",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
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
            {selectedFile ? (
              <ResumePreview 
                file={selectedFile} 
                filePath={filePath}
                publicUrl={publicUrl}
                onCancel={handleCancelResume}
              />
            ) : (
              <ResumeUploader onFileUpload={handleFileUpload} />
            )}
            <JobUrlInput onUrlSubmit={handleUrlSubmit} isProcessing={isProcessing} />
            {isProcessing && <ProcessingPreview />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;