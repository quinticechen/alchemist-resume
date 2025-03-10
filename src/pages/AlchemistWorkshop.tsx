
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ResumeUploader from "@/components/ResumeUploader";
import JobUrlInput, { SUPPORTED_JOB_SITES } from "@/components/JobUrlInput";
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
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);

  // Track if we've already checked the subscription in this session
  const hasCheckedSubscription = useRef(false);

  // Function to navigate to records page (defined outside of conditional rendering)
  const viewAllRecords = () => {
    navigate("/alchemy-records");
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !session) {
      navigate("/login", { state: { from: "/alchemist-workshop" } });
    } else if (!isLoading && session && !hasCheckedSubscription.current) {
      // Only check subscription once per session/component mount
      hasCheckedSubscription.current = true;

      // Check if this is a fresh login or returning visit
      const isReturningVisit =
        sessionStorage.getItem("hasVisitedWorkshop") === "true";

      // Only show welcome toast on first visit after login, not on subsequent visits
      checkSubscriptionAndRedirect(session.user.id, !isReturningVisit);

      // Mark that user has visited the workshop in this session
      sessionStorage.setItem("hasVisitedWorkshop", "true");
    }
  }, [session, isLoading, navigate, checkSubscriptionAndRedirect]);

  // Listen for google_doc_url updates when analysis is complete
  useEffect(() => {
    if (analysisId) {
      const fetchAnalysis = async () => {
        const { data } = await supabase
          .from("resume_analyses")
          .select("google_doc_url")
          .eq("id", analysisId)
          .single();

        if (data?.google_doc_url) {
          setGoogleDocUrl(data.google_doc_url);
          setIsGenerationComplete(true);
          setShowLoadingAnimation(false);
          if (timeoutId.current) {
            clearTimeout(timeoutId.current);
            timeoutId.current = null;
          }
        }
      };

      fetchAnalysis();

      // Set up real-time subscription
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
            // console.log("Received real-time update for analysis:", payload);
            if (payload.new.google_doc_url) {
              setGoogleDocUrl(payload.new.google_doc_url);
              setIsGenerationComplete(true);
              setShowLoadingAnimation(false);

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
    // Reset states
    setIsProcessing(true);
    setIsTimeout(false);
    setTimeoutMessage(null);
    setIsGenerationComplete(false);
    setShowLoadingAnimation(true);
    setGoogleDocUrl(null);

    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    try {
      // First, create the analysis record in the database
      const { data: analysisRecord, error: analysisError } = await supabase
        .from("resume_analyses")
        .insert({
          resume_id: resumeId,
          job_url: url,
          user_id: session?.user?.id,
        })
        .select()
        .single();

      if (analysisError) {
        console.error("Error creating analysis record:", analysisError);
        throw analysisError;
      }

      // Get the resume details
      const { data: resumeData, error: resumeError } = await supabase
        .from("resumes")
        .select("file_name, file_path")
        .eq("id", resumeId)
        .single();

      if (resumeError) {
        console.error("Error fetching resume:", resumeError);
        throw resumeError;
      }

      // Get the storage URL for the resume
      const { data: storageData } = supabase.storage
        .from("resumes")
        .getPublicUrl(resumeData.file_path);

      const webhookData = {
        analysisId: analysisRecord.id,
        resumeUrl: storageData.publicUrl,
        jobUrl: url,
        fileName: resumeData.file_name,
      };

      // Get environment-specific webhook URL
      const currentEnv = getEnvironment();
      const makeWebhookUrl = currentEnv === 'production' 
        ? "https://hook.eu2.make.com/pthisc4aefvf15i7pj4ja99a84dp7kce" 
        : "https://hook.eu2.make.com/2up5vi5mr8jhhdl1eclyw3shu99uoxlb";

      console.log(`Using ${currentEnv} webhook URL: ${makeWebhookUrl}`);

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
        description:
          "Your resume is being analyzed. Results will be available soon.",
      });

      // Set five-minute timeout
      timeoutId.current = setTimeout(() => {
        if (!isGenerationComplete) {
          toast({
            title: "Generation Failed",
            description:
              "Resume generation took too long. Please try again later.",
            variant: "destructive",
          });
          setIsTimeout(true);
          setTimeoutMessage(
            "Resume generation took too long. Please try again later."
          );
          setShowLoadingAnimation(false);
        }
      }, 5 * 60 * 1000); // Five minutes
    } catch (error) {
      // console.error("Error processing resume:", error);
      toast({
        title: "Error",
        description: "Failed to process resume. Please try again later.",
        variant: "destructive",
      });
      setIsProcessing(false);
      setShowLoadingAnimation(false);
    }
  };

  const handleGenerationComplete = () => {
    // console.log("Generation complete callback triggered");
    setIsGenerationComplete(true);
    setShowLoadingAnimation(false);
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  // Don't render anything if not authenticated (will redirect)
  if (!session) {
    return null;
  }

  // Lottie settings
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

        {/* Loading animation section - show when processing and not complete or timed out */}
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

        {/* Error/Timeout section */}
        {isTimeout && timeoutMessage && (
          <section className="text-center">
            <div className="py-8">
              <div className="w-64 h-64 mx-auto">
                <Lottie options={failedOptions} />
              </div>
              <p className="mt-4 text-gray-600">{timeoutMessage}</p>
            </div>
          </section>
        )}

        {/* Success section - show when Google Doc URL is available */}
        {googleDocUrl && (
          <div className="flex flex-wrap justify-center gap-4 mt-8">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default AlchemistWorkshop;
