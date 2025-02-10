import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ResumeUploader from "@/components/ResumeUploader";
import JobUrlInput from "@/components/JobUrlInput";
import ProcessingPreview from "@/components/ProcessingPreview";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AlchemistWorkshop = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string>("");
  const [publicUrl, setPublicUrl] = useState<string>("");
  const [resumeId, setResumeId] = useState<string>("");
  const [jobUrl, setJobUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisId, setAnalysisId] = useState<string>("");
  const [usageCount, setUsageCount] = useState(0);
  const [hasCompletedSurvey, setHasCompletedSurvey] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkUsageAndSurvey();
  }, []);

  const checkUsageAndSurvey = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/login');
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('usage_count, has_completed_survey')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    if (profile) {
      setUsageCount(profile.usage_count || 0);
      setHasCompletedSurvey(profile.has_completed_survey || false);

      if (profile.usage_count >= 3 && !profile.has_completed_survey) {
        toast({
          title: "Survey Required",
          description: "Please complete the survey to continue using our services.",
        });
        navigate('/pre-pricing');
        return;
      }

      if (profile.usage_count >= 3) {
        toast({
          title: "Free Trial Completed",
          description: "Please upgrade to continue using our services.",
        });
        navigate('/account');
        return;
      }
    }
  };

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
    if (usageCount >= 3 && !hasCompletedSurvey) {
      toast({
        title: "Survey Required",
        description: "Please complete the survey to continue using our services.",
      });
      navigate('/pre-pricing');
      return;
    }

    if (usageCount >= 3) {
      toast({
        title: "Free Trial Completed",
        description: "Please upgrade to continue using our services.",
      });
      navigate('/account');
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
      setJobUrl(url);
      setAnalysisId(data.analysisId);

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

  const viewAllRecords = () => {
    navigate('/alchemy-records');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold bg-gradient-primary text-transparent bg-clip-text">
          Alchemist Workshop
        </h1>

        <ResumeUploader onUploadSuccess={handleFileUploadSuccess} />

        {selectedFile && (
          <JobUrlInput
            onUrlSubmit={handleUrlSubmit}
            isProcessing={isProcessing}
            jobUrl={jobUrl}
            setJobUrl={setJobUrl}
            resumeId={resumeId}
            setIsProcessing={setIsProcessing}
          />
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
