
import React, { useState } from "react";
import ResumeUploader from "@/components/ResumeUploader";
import JobUrlInput from "@/components/JobUrlInput";
import ResumePreview from "@/components/ResumePreview";
import AlchemistSection from "@/components/AlchemistSection";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string>();
  const [publicUrl, setPublicUrl] = useState<string>();
  const [resumeId, setResumeId] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAlchemist, setShowAlchemist] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (file: File, path: string, url: string, id: string) => {
    console.log("File uploaded:", file.name, "Path:", path, "Public URL:", url, "ID:", id);
    setSelectedFile(file);
    setFilePath(path);
    setPublicUrl(url);
    setResumeId(id);
    setShowAlchemist(false);
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
        setShowAlchemist(false);

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
      setShowAlchemist(true);

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
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <Header />
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-10 animate-fade-up">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-primary text-transparent bg-clip-text">
              ResumeAlchemist
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Transform your resume into a perfect match for your dream job using our AI-powered analysis
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
              <ResumeUploader 
                onUploadSuccess={handleFileUpload}
                onFileUpload={handleFileUpload}
              />
            )}
            <JobUrlInput onUrlSubmit={handleUrlSubmit} isProcessing={isProcessing} />
            {showAlchemist && resumeId && <AlchemistSection resumeId={resumeId} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
