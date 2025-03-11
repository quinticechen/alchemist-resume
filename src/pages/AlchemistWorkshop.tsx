
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ResumeUploader from "@/components/ResumeUploader";
import JobUrlInput from "@/components/JobUrlInput";
import ProcessingPreview from "@/components/ProcessingPreview";
import { Button } from "@/components/ui/button";
import { History, FileText, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";
import Lottie from "react-lottie";
import Loading from "@/animations/Loading.json";
import Failed from "@/animations/Failed.json";
import { getEnvironment } from "@/integrations/supabase/client";

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
  const { checkSubscriptionAndRedirect } = useSubscriptionCheck();
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const [isTimeout, setIsTimeout] = useState(false);
  const [timeoutMessage, setTimeoutMessage] = useState<string | null>(null);
  const [isGenerationComplete, setIsGenerationComplete] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
  const [showFailedAnimation, setShowFailedAnimation] = useState(false); 
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);

  const hasCheckedSubscription = useRef(false);

  useEffect(() => {
    setIsProcessing(false);
    setIsGenerationComplete(true);
  }, []);

  const viewAllRecords = () => {
    navigate("/alchemy-records");
  };

  useEffect(() => {
    if (!isLoading && !session) {
      navigate("/login", { state: { from: "/alchemist-workshop" } });
    } else if (!isLoading && session && !hasCheckedSubscription.current) {
      hasCheckedSubscription.current = true;

      const isReturningVisit =
        sessionStorage.getItem("hasVisitedWorkshop") === "true";

      checkSubscriptionAndRedirect(session.user.id, !isReturningVisit);

      sessionStorage.setItem("hasVisitedWorkshop", "true");
    }
  }, [session, isLoading, navigate, checkSubscriptionAndRedirect]);

  useEffect(() => {
    if (analysisId) {
      const fetchAnalysis = async () => {
        try {
          const { data, error } = await supabase
            .from("resume_analyses")
            .select("google_doc_url")
            .eq("id", analysisId)
            .single();

          if (error) {
            console.error("Error fetching analysis:", error);
            return;
          }

          if (data?.google_doc_url) {
            setGoogleDocUrl(data.google_doc_url);
            setIsGenerationComplete(true);
            setShowLoadingAnimation(false);
            setShowFailedAnimation(false);
            if (timeoutId.current) {
              clearTimeout(timeoutId.current);
              timeoutId.current = null;
            }
          }
        } catch (error) {
          console.error('Error fetching analysis data:', error);
        }
      };

      fetchAnalysis();

      const channel = supabase
        .channel(`analysis-${analysisId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "resume_analyses",
            filter: `id=eq.${analysisId}`,
          },
          (payload) => {
            console.log("Realtime update received:", payload);
            
            if (payload.new.google_doc_url) {
              setGoogleDocUrl(payload.new.google_doc_url);
              setIsGenerationComplete(true);
              setShowLoadingAnimation(false);
              setShowFailedAnimation(false);
              setIsTimeout(false);

              toast({
                title: "Resume Alchemist Complete!",
                description: "Your customized resume is now ready",
              });

              if (timeoutId.current) {
                clearTimeout(timeoutId.current);
                timeoutId.current = null;
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [analysisId, toast]);

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
    setIsTimeout(false);
    setTimeoutMessage(null);
    setIsGenerationComplete(false);
    setShowLoadingAnimation(true);
    setShowFailedAnimation(false);
    setGoogleDocUrl(null);

    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    try {
      // First, create a job entry in the jobs table
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .insert({
          company_url: url,
          user_id: session?.user?.id
        })
        .select()
        .single();

      if (jobError) {
        console.error('Error creating job record:', jobError);
        throw jobError;
      }

      const jobId = jobData.id;

      // Then create the analysis record with the job_id
      const { data: analysisRecord, error: analysisError } = await supabase
        .from('resume_analyses')
        .insert({
          resume_id: resumeId,
          job_url: url,
          job_id: jobId,
          user_id: session?.user?.id,
        })
        .select()
        .single();

      if (analysisError) {
        console.error('Error creating analysis record:', analysisError);
        throw analysisError;
      }

      // Get resume details for the webhook
      const { data: resumeData, error: resumeError } = await supabase
        .from('resumes')
        .select('file_name, file_path')
        .eq('id', resumeId)
        .single();

      if (resumeError) {
        console.error('Error fetching resume:', resumeError);
        throw resumeError;
      }

      const { data: storageData } = supabase.storage
        .from('resumes')
        .getPublicUrl(resumeData.file_path);

      // Prepare webhook data
      const webhookData = {
        analysisId: analysisRecord.id,
        jobId: jobId,
        resumeUrl: storageData.publicUrl,
        jobUrl: url,
        fileName: resumeData.file_name,
      };

      const currentEnv = getEnvironment();
      const makeWebhookUrl = currentEnv === 'production' 
        ? "https://hook.eu2.make.com/pthisc4aefvf15i7pj4ja99a84dp7kce" 
        : "https://hook.eu2.make.com/2up5vi5mr8jhhdl1eclyw3shu99uoxlb";

      console.log(`Using ${currentEnv} webhook URL: ${makeWebhookUrl}`);
      console.log("Sending webhook data:", webhookData);

      const webhookResponse = await fetch(makeWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookData),
      });

      if (!webhookResponse.ok) {
        throw new Error("Failed to trigger Make.com webhook");
      }

      setJobUrl(url);
      setAnalysisId(analysisRecord.id);

      toast({
        title: "Analysis Started",
        description: "Your resume is being analyzed. Results will be available soon.",
      });

      // Set timeout for 5 minutes
      timeoutId.current = setTimeout(() => {
        if (!isGenerationComplete) {
          setIsTimeout(true);
          setTimeoutMessage(
            "Resume generation took too long. Please try again later."
          );
          setShowLoadingAnimation(false);
          setShowFailedAnimation(true);
          
          toast({
            title: "Generation Failed",
            description: "Resume generation took too long. Please try again later.",
            variant: "destructive",
          });
        }
      }, 5 * 60 * 1000);
    } catch (error) {
      console.error('Error processing resume:', error);
      toast({
        title: "Error",
        description: "Failed to process resume. Please try again later.",
        variant: "destructive",
      });
      setIsProcessing(false);
      setShowLoadingAnimation(false);
      setShowFailedAnimation(true);
      setIsGenerationComplete(true);
      setIsTimeout(true);
      setTimeoutMessage("Failed to process resume. Please try again later.");
    }
  };

  const handleGenerationComplete = () => {
    setIsGenerationComplete(true);
    setShowLoadingAnimation(false);
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, []);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const loadingOptions = {
    loop: true,
    autoplay: true,
    animationData: Loading,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const failedOptions = {
    loop: true,
    autoplay: true,
    animationData: Failed,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold bg-gradient-primary text-transparent bg-clip-text text-center">
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
            isGenerationComplete={isGenerationComplete}
          />
        )}

        {isProcessing && analysisId && (
          <ProcessingPreview
            analysisId={analysisId}
            jobUrl={jobUrl}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            onGenerationComplete={handleGenerationComplete}
          />
        )}

        {showLoadingAnimation && !isGenerationComplete && !isTimeout && (
          <section className="text-center">
            <div className="py-8">
              <div className="w-64 h-64 mx-auto">
                <Lottie options={loadingOptions} />
              </div>
              <p className="mt-4 text-gray-600">
                Your resume is being alchemized. Please wait a few minutes...
              </p>
            </div>
          </section>
        )}

        {(isTimeout || showFailedAnimation) && timeoutMessage && (
          <section className="text-center">
            <div className="py-8">
              <div className="w-64 h-64 mx-auto">
                <Lottie options={failedOptions} />
              </div>
              <p className="mt-4 text-gray-600">{timeoutMessage}</p>
            </div>
          </section>
        )}

        {/* {googleDocUrl && isGenerationComplete && (
          <section className="flex flex-wrap justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(googleDocUrl, "_blank")}
              className="text-info border-info/20 hover:bg-info/5"
            >
              <Crown className="h-4 w-4 mr-2" />
              Golden Resume
            </Button>

            <Button
              variant="outline"
              onClick={viewAllRecords}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              View All Records
            </Button>
          </section>
        )} */}
      </div>
    </div>
  );
};

export default AlchemistWorkshop;
