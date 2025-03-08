
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ResumeUploader from "@/components/ResumeUploader";
import JobUrlInput, { SUPPORTED_JOB_SITES } from "@/components/JobUrlInput";
import ProcessingPreview from "@/components/ProcessingPreview";
import { Button } from "@/components/ui/button";
import { History, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";
import Lottie from "react-lottie";
import Loading from "@/animations/Loading.json";
import Failed from "@/animations/Failed.json";

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
  
  // Track if we've already checked the subscription in this session
  const hasCheckedSubscription = useRef(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !session) {
      navigate("/login", { state: { from: "/alchemist-workshop" } });
    } else if (!isLoading && session && !hasCheckedSubscription.current) {
      // Only check subscription once per session/component mount
      hasCheckedSubscription.current = true;
      
      // Check if this is a fresh login or returning visit
      const isReturningVisit = sessionStorage.getItem('hasVisitedWorkshop') === 'true';
      
      // Only show welcome toast on first visit after login, not on subsequent visits
      checkSubscriptionAndRedirect(session.user.id, !isReturningVisit);
      
      // Mark that user has visited the workshop in this session
      sessionStorage.setItem('hasVisitedWorkshop', 'true');
    }
  }, [session, isLoading, navigate, checkSubscriptionAndRedirect]);

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
    
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    try {
      console.log("Creating analysis record with data:", {
        resume_id: resumeId,
        job_url: url,
        user_id: session?.user?.id,
      });

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

      console.log("Analysis record created:", analysisRecord);

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

      console.log("Resume data fetched:", resumeData);

      // Get the storage URL for the resume
      const { data: storageData } = supabase.storage
        .from("resumes")
        .getPublicUrl(resumeData.file_path);

      console.log("Storage URL generated:", storageData);

      const webhookData = {
        analysisId: analysisRecord.id,
        resumeUrl: storageData.publicUrl,
        jobUrl: url,
        fileName: resumeData.file_name,
      };

      console.log("Preparing to send webhook data:", webhookData);

      // Trigger the Make.com webhook with the correct data format
      const makeWebhookUrl =
        "https://hook.eu2.make.com/pthisc4aefvf15i7pj4ja99a84dp7kce";
      console.log("Sending webhook to:", makeWebhookUrl);

      const webhookResponse = await fetch(makeWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookData),
      });

      console.log("Webhook response status:", webhookResponse.status);

      if (!webhookResponse.ok) {
        console.error("Webhook response not OK:", webhookResponse);
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
          // Update the analysis record with an error message using async/await
          const updateAnalysis = async () => {
            try {
              await supabase
                .from("resume_analyses")
                .update({ 
                  error: "Resume generation took too long. Please try again later." 
                })
                .eq("id", analysisRecord.id);
              
              console.log("Updated analysis with timeout error");
            } catch (err) {
              console.error("Error updating analysis with timeout:", err);
            }
          };
          
          // Execute the async function
          updateAnalysis();

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
      console.error("Error processing resume:", error);
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
    console.log("Generation complete callback triggered");
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
          <>
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
            resumeId={resumeId}
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
      </div>
    </div>
  );
};

export default AlchemistWorkshop;
