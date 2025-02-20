import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ResumeUploader from "@//ResumeUploader";
import JobUrlInput from "@//JobUrlInput";
import ProcessingPreview from "@//ProcessingPreview";
import { Button } from "@//ui/button";
import { History, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SUPPORTED_JOB_SITES = [
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
  "foundit", // foundit.in, foundit.hk
  "ziprecruiter.com",
  "simplyhired.com",
  "104.com.tw",
  "1111.com.tw",
  "jobsdb.com",
  "next.rikunabi.com",
  "51job.com",
];

const AlchemistWorkshop = () => {
  const { session, isLoading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<>("");
  const [publicUrl, setPublicUrl] = useState<>("");
  const [resumeId, setResumeId] = useState<>("");
  const [jobUrl, setJobUrl] = useState<>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisId, setAnalysisId] = useState<>("");
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
    path: ,
    url: ,
    id: 
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
      let processedUrl = url;
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      if (!hostname.includes("indeed.com") && !hostname.includes("ziprecruiter.com")) {
        processedUrl = url.split("?")[0];
      }

      const isValidUrl = SUPPORTED_JOB_SITES.some((site) => hostname.includes(site));

      if (!isValidUrl || url.includes("search")) {
        toast({
          title: "Invalid URL Format",
          description: "Please use the share button within the job posting to get the correct URL. URLs with search parameters are not supported.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      console.log('Creating analysis record with data:', {
        resume_id: resumeId,
        job_url: processedUrl, // 使用處理後的 URL
        user_id: session?.user?.id
      });

      // ... (其餘的資料庫和 webhook 邏輯保持不變)
      const { data: analysisRecord, error: analysisError } = await supabase
        .from('resume_analyses')
        .insert({
          resume_id: resumeId,
          job_url: processedUrl,
          user_id: session?.user?.id
        })
        .select()
        .single();

      // ... (其餘的資料庫和 webhook 邏輯保持不變)

      setJobUrl(processedUrl);
      setAnalysisId(analysisRecord.id);

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