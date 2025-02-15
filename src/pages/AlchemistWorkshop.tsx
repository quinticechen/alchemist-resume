
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
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }

      // Check subscription status
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, tier')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (subscription?.status === 'active' && 
          (subscription.tier === 'alchemist' || subscription.tier === 'grandmaster')) {
        return; // User has access
      }

      // Check profile subscription status as fallback
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, usage_count, free_trial_limit, has_completed_survey')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        navigate('/login');
        return;
      }

      // Handle premium status in profile
      if (profile.subscription_status === 'grandmaster' || 
          profile.subscription_status === 'alchemist') {
        return; // User has access
      }

      // Check free trial
      if (profile.usage_count >= profile.free_trial_limit) {
        toast({
          title: "Free Trial Completed",
          description: "Please upgrade to continue using our services.",
        });
        navigate('/pricing');
        return;
      }
    };

    checkAccess();
  }, []);

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
      const { data, error } = await supabase.functions.invoke('process-resume', {
        body: {
          resumeId,
          jobUrl: url,
        },
      });

      if (error) throw error;

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
