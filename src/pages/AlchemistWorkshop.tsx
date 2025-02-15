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
    checkAccessAndUsage();
  }, []);

  const checkAccessAndUsage = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/login');
      return;
    }

    try {
      console.log("Checking access for user:", session.user.id);

      // First check active subscription
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('tier, status')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (subError) {
        console.error("Error checking subscription:", subError);
        throw subError;
      }

      console.log("Subscription check result:", subscription);

      // If there's an active subscription, allow access immediately
      if (subscription?.status === 'active') {
        console.log('Active subscription found:', subscription.tier);
        return; // Allow access
      }

      // If no active subscription, check profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_status, usage_count, free_trial_limit, has_completed_survey, monthly_usage_count')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error checking profile:", profileError);
        throw profileError;
      }

      console.log("Profile check result:", profile);

      if (!profile) {
        console.error("No profile found for user");
        navigate('/login');
        return;
      }

      setUsageCount(profile.usage_count || 0);
      setHasCompletedSurvey(profile.has_completed_survey || false);

      // Check subscription status from profile
      if (profile.subscription_status === 'grandmaster') {
        console.log("User is grandmaster, allowing access");
        return; // Allow access
      }

      if (profile.subscription_status === 'alchemist') {
        console.log("User is alchemist, checking monthly usage");
        const monthlyUsage = profile.monthly_usage_count || 0;
        if (monthlyUsage >= 30) {
          console.log("Monthly limit reached");
          toast({
            title: "Monthly Limit Reached",
            description: "You've reached your monthly usage limit. Please upgrade to our Grandmaster plan for unlimited access.",
          });
          navigate('/pricing');
          return;
        }
        return; // Allow access if under monthly limit
      }

      // Free tier (apprentice) checks
      console.log("User is apprentice, checking usage count:", profile.usage_count, "limit:", profile.free_trial_limit);
      if (profile.usage_count >= profile.free_trial_limit) {
        if (!profile.has_completed_survey) {
          console.log("Survey not completed, redirecting to survey");
          toast({
            title: "Survey Required",
            description: "Please complete the survey to continue using our services.",
          });
          navigate('/survey-page');
        } else {
          console.log("Free trial completed, redirecting to pricing");
          toast({
            title: "Free Trial Completed",
            description: "Please upgrade to continue using our services.",
          });
          navigate('/pricing');
        }
        return;
      }
    } catch (error) {
      console.error("Error in checkAccessAndUsage:", error);
      toast({
        title: "Error",
        description: "An error occurred while checking access. Please try again.",
        variant: "destructive",
      });
      navigate('/login');
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
    // Recheck access before processing
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/login');
      return;
    }

    // Check subscription status again
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', session.user.id)
      .single();

    if (subscription && subscription.status === 'active') {
      // Process normally for active subscribers
      await processResume(url);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, usage_count, free_trial_limit, has_completed_survey, monthly_usage_count')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      if (profile.subscription_status === 'grandmaster') {
        await processResume(url);
        return;
      }

      if (profile.subscription_status === 'alchemist') {
        const monthlyUsage = profile.monthly_usage_count || 0;
        if (monthlyUsage >= 30) {
          toast({
            title: "Monthly Limit Reached",
            description: "Please upgrade to continue using our services.",
          });
          navigate('/pricing');
          return;
        }
        await processResume(url);
        return;
      }

      // Free tier checks
      if (profile.usage_count >= profile.free_trial_limit) {
        if (!profile.has_completed_survey) {
          toast({
            title: "Survey Required",
            description: "Please complete the survey to continue using our services.",
          });
          navigate('/survey-page');
        } else {
          toast({
            title: "Free Trial Completed",
            description: "Please upgrade to continue using our services.",
          });
          navigate('/pricing');
        }
        return;
      }

      await processResume(url);
    }
  };

  const processResume = async (url: string) => {
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
