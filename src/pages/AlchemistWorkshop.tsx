
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ResumeUploader from "@/components/ResumeUploader";
import JobUrlInput from "@/components/JobUrlInput";
import ProcessingPreview from "@/components/ProcessingPreview";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";
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
  const [isGenerationComplete, setIsGenerationComplete] = useState(false);
  const hasCheckedSubscription = useRef(false);

  useEffect(() => {
    // Only reset processing state initially, but don't mark as complete
    // unless we've already generated a resume
    if (analysisId === "") {
      setIsProcessing(false);
      setIsGenerationComplete(false);
    }
  }, [analysisId]);

  // Check session and subscription
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
    // Reset states when a new file is uploaded
    setJobUrl("");
    setAnalysisId("");
    setIsProcessing(false);
    setIsTimeout(false);
    setIsGenerationComplete(false);
    
    toast({
      title: "Upload successful",
      description: "Your resume has been uploaded successfully.",
    });
  };

  const handleUrlSubmit = async (url: string) => {
    // Reset states for new submission
    setIsProcessing(true);
    setIsTimeout(false);
    setIsGenerationComplete(false);

    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    try {
      // First, create a job entry in the jobs table
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .insert({
          company_url: url,
          user_id: session?.user?.id,
        })
        .select()
        .single();

      if (jobError) {
        console.error("Error creating job record:", jobError);
        throw jobError;
      }

      const jobId = jobData.id;

      // Then create the analysis record with the job_id
      const { data: analysisRecord, error: analysisError } = await supabase
        .from("resume_analyses")
        .insert({
          resume_id: resumeId,
          job_url: url,
          job_id: jobId,
          user_id: session?.user?.id,
          status: "pending", // Using the new enum value
        })
        .select()
        .single();

      if (analysisError) {
        console.error("Error creating analysis record:", analysisError);
        throw analysisError;
      }

      // Get resume details for the webhook
      const { data: resumeData, error: resumeError } = await supabase
        .from("resumes")
        .select("file_name, file_path")
        .eq("id", resumeId)
        .single();

      if (resumeError) {
        console.error("Error fetching resume:", resumeError);
        throw resumeError;
      }

      const { data: storageData } = supabase.storage
        .from("resumes")
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
      const makeWebhookUrl =
        currentEnv === "production"
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
        description:
          "Your resume is being analyzed. Results will be available soon.",
      });

      // Set timeout for 5 minutes
      timeoutId.current = setTimeout(() => {
        console.log("Timeout reached. Setting timeout state to true");
        setIsTimeout(true);
        setIsProcessing(false);

        // Also update the analysis with a timeout status
        supabase
          .from("resume_analyses")
          .update({
            error: "Resume generation took too long. Please try again later.",
            status: "timeout",
          })
          .eq("id", analysisRecord.id)
          .then(({ error }) => {
            if (error) {
              console.error("Error updating analysis with timeout:", error);
            }
          });

        toast({
          title: "Generation Timed Out",
          description:
            "Resume generation took too long. Please try again later.",
          variant: "destructive",
        });
      }, 5 * 60 * 1000);
    } catch (error) {
      console.error("Error processing resume:", error);
      toast({
        title: "Error",
        description: "Failed to process resume. Please try again later.",
        variant: "destructive",
      });
      setIsProcessing(false);
      setIsGenerationComplete(true);
      setIsTimeout(false);
    }
  };

  const handleGenerationComplete = () => {
    setIsGenerationComplete(true);
    setIsProcessing(false);
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

        {analysisId && (
          <ProcessingPreview
            analysisId={analysisId}
            jobUrl={jobUrl}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            onGenerationComplete={handleGenerationComplete}
            isTimeout={isTimeout}
          />
        )}
      </div>
    </div>
  );
};

export default AlchemistWorkshop;
