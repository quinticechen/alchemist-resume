
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ResumeUploader from "@/components/ResumeUploader";
import JobUrlInput from "@/components/JobUrlInput";
import ProcessingPreview from "@/components/ProcessingPreview";
import { Button } from "@/components/ui/button";
import { History, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const AlchemistWorkshop = () => {
  const { session, isLoading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string>("");
  const [publicUrl, setPublicUrl] = useState<string>("");
  const [resumeId, setResumeId] = useState<string>("");
  const [jobUrl, setJobUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisId, setAnalysisId] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !session) {
      navigate('/login', { state: { from: '/alchemist-workshop' } });
    }
  }, [session, isLoading, navigate]);

  const handleFileUploadSuccess = (
    file: File,
    path: string,
    url: string,
    id: string
  ) => {
    setSelectedFile(file);
    setFilePath(path);
    setPublicUrl(url);
    setResumeId(id);
    toast({
      title: "Upload successful",
      description: "Your resume has been uploaded successfully.",
    });
  };

  const handleUrlSubmit = async (url: string) => {
    setIsProcessing(true);
    try {
      // Check for search parameters in URL
      const urlObj = new URL(url);
      if (urlObj.search) {
        toast({
          title: "Invalid URL Format",
          description: "Please use the share button within the job posting to get the correct URL. URLs with search parameters are not supported.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // First process the resume through Supabase to get the analysis ID
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('process-resume', {
        body: {
          resumeId,
          jobUrl: url,
        },
      });

      if (analysisError) {
        console.error('Error processing resume:', analysisError);
        throw analysisError;
      }

      // Get the resume details
      const { data: resumeData, error: resumeError } = await supabase
        .from('resumes')
        .select('file_name, file_path')
        .eq('id', resumeId)
        .single();

      if (resumeError) {
        console.error('Error fetching resume:', resumeError);
        throw resumeError;
      }

      // Get the storage URL for the resume
      const { data: storageData } = supabase.storage
        .from('resumes')
        .getPublicUrl(resumeData.file_path);

      // Trigger the Make.com webhook with the correct data format
      const makeWebhookUrl = 'https://hook.eu2.make.com/ug8t2abll9xnyl3zas6d47385y3roa22';
      const webhookResponse = await fetch(makeWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisId: analysisData.analysisId,
          resumeUrl: storageData.publicUrl,
          jobUrl: url,
          fileName: resumeData.file_name
        }),
      });

      if (!webhookResponse.ok) {
        throw new Error('Failed to trigger Make.com webhook');
      }

      setJobUrl(url);
      setAnalysisId(analysisData.analysisId);

      toast({
        title: "Analysis Started",
        description: "Your resume is being analyzed. Results will be available soon.",
      });
    } catch (error) {
      console.error('Error processing resume:', error);
      toast({
        title: "Error",
        description: "Failed to process resume. Please try again later.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const viewAllRecords = () => {
    navigate('/alchemy-records');
  };

  const previewOriginalResume = () => {
    if (filePath) {
      const { data } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);
      window.open(data.publicUrl, '_blank');
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  // Don't render anything if not authenticated (will redirect)
  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold bg-gradient-primary text-transparent bg-clip-text text-center">
          Alchemist Workshop
        </h1>

        <ResumeUploader onUploadSuccess={handleFileUploadSuccess} />

        {selectedFile && (
          <>
            <Button
              variant="outline"
              onClick={previewOriginalResume}
              className="w-full flex items-center justify-center gap-2 text-primary border-primary/20 hover:bg-primary/5"
            >
              <FileText className="h-4 w-4" />
              Preview Original Resume
            </Button>

            <JobUrlInput
              onUrlSubmit={handleUrlSubmit}
              isProcessing={isProcessing}
              jobUrl={jobUrl}
              setJobUrl={setJobUrl}
              resumeId={resumeId}
              setIsProcessing={setIsProcessing}
            />
          </>
        )}

        {isProcessing && analysisId && (
          <ProcessingPreview
            analysisId={analysisId}
            jobUrl={jobUrl}
            setIsProcessing={setIsProcessing}
          />
        )}

        {analysisId && (
          <div className="flex justify-center pt-8">
            <Button
              variant="outline"
              onClick={viewAllRecords}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              View All Records
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlchemistWorkshop;
