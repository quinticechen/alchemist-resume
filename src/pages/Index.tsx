import React, { useState } from "react";
import ResumeUploader from "@/components/ResumeUploader";
import JobUrlInput from "@/components/JobUrlInput";
import ResumePreview from "@/components/ResumePreview";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
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
      const response = await fetch(
        'https://vhofgqmmovjtcnakowlv.supabase.co/functions/v1/process-resume',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            resumeId,
            jobUrl: url,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to process resume');
      }

      const data = await response.json();
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
    } finally {
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
              <div className="space-y-4">
                <ResumePreview 
                  file={selectedFile} 
                  filePath={filePath}
                  publicUrl={publicUrl}
                />
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancelResume}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel Resume
                  </Button>
                </div>
              </div>
            ) : (
              <ResumeUploader onFileUpload={handleFileUpload} />
            )}
            <JobUrlInput onUrlSubmit={handleUrlSubmit} isProcessing={isProcessing} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;