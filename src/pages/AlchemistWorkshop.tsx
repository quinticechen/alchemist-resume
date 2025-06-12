import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ResumeUploader from "@/components/ResumeUploader";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import ProcessingPreview from "@/components/ProcessingPreview";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";
import { getEnvironment } from "@/integrations/supabase/client";
import Lottie from "react-lottie";
import Loading from "@/animations/Loading.json";

const AlchemistWorkshop = () => {
  const { session, isLoading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string>("");
  const [publicUrl, setPublicUrl] = useState<string>("");
  const [resumeId, setResumeId] = useState<string>("");
  const [resumeContent, setResumeContent] = useState<string>("");
  const [isFromPreviousResume, setIsFromPreviousResume] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisId, setAnalysisId] = useState<string>("");
  const [hasResumeReady, setHasResumeReady] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkSubscriptionAndRedirect } = useSubscriptionCheck();
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const [isTimeout, setIsTimeout] = useState(false);
  const [isGenerationComplete, setIsGenerationComplete] = useState(false);
  const hasCheckedSubscription = useRef(false);
  const [activeTab, setActiveTab] = useState<string>("upload");

  const loadingOptions = {
    loop: true,
    autoplay: true,
    animationData: Loading,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  
  useEffect(() => {
    if (analysisId === "") {
      setIsProcessing(false);
      setIsGenerationComplete(false);
    }
  }, [analysisId]);

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
    setResumeContent("");
    setIsFromPreviousResume(false);
    setHasResumeReady(true);
    setAnalysisId("");
    setIsProcessing(false);
    setIsTimeout(false);
    setIsGenerationComplete(false);

    toast({
      title: "Resume ready",
      description: "Your resume has been uploaded successfully.",
    });
  };

  const handleResumeSelection = (id: string, name: string, path: string, content: string) => {
    setResumeId(id);
    setSelectedFile(null);
    setFilePath(path);
    setPublicUrl("");
    setResumeContent(content);
    setIsFromPreviousResume(true);
    setHasResumeReady(true);
    setAnalysisId("");
    setIsProcessing(false);
    setIsTimeout(false);
    setIsGenerationComplete(false);

    toast({
      title: "Resume selected",
      description: `${name} has been selected successfully.`,
    });
  };

  const handleResetResume = () => {
    setSelectedFile(null);
    setFilePath("");
    setPublicUrl("");
    setResumeId("");
    setResumeContent("");
    setIsFromPreviousResume(false);
    setHasResumeReady(false);
  };

  const handleJobSubmit = async (data: { jobUrl?: string; jobContent?: string }) => {
    setIsProcessing(true);
    setIsTimeout(false);
    setIsGenerationComplete(false);

    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    try {
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .insert({
          company_url: data.jobUrl || null,
          job_url: data.jobUrl || null,
          job_content: data.jobContent || null,
          user_id: session?.user?.id,
        })
        .select()
        .single();

      if (jobError) {
        throw jobError;
      }

      const jobId = jobData.id;

      const { data: analysisRecord, error: analysisError } = await supabase
        .from("resume_analyses")
        .insert({
          resume_id: resumeId,
          job_id: jobId,
          user_id: session?.user?.id,
          status: "pending",
        })
        .select()
        .single();

      if (analysisError) {
        throw analysisError;
      }

      const { data: resumeData, error: resumeError } = await supabase
        .from("resumes")
        .select("file_name, file_path, formatted_resume")
        .eq("id", resumeId)
        .single();

      if (resumeError) {
        throw resumeError;
      }

      // Prepare webhook data based on the scenario
      let webhookData: any = {
        analysisId: analysisRecord.id,
        fileName: resumeData.file_name,
      };

      // Scenario 1: Previous resume + job description
      if (isFromPreviousResume && data.jobContent) {
        webhookData.resumeContent = resumeData.formatted_resume || "";
        webhookData.jobContent = data.jobContent;
      }
      // Scenario 2: Previous resume + job URL  
      else if (isFromPreviousResume && data.jobUrl) {
        webhookData.resumeContent = resumeData.formatted_resume || "";
        webhookData.jobUrl = data.jobUrl;
      }
      // Scenario 3: New resume + job URL
      else if (!isFromPreviousResume && data.jobUrl) {
        webhookData.resumeUrl = resumeData.file_path;
        webhookData.jobUrl = data.jobUrl;
      }
      // Scenario 4: New resume + job description
      else if (!isFromPreviousResume && data.jobContent) {
        webhookData.resumeUrl = resumeData.file_path;
        webhookData.jobContent = data.jobContent;
      }

      const currentEnv = getEnvironment();
      const makeWebhookUrl =
        currentEnv === "production"
          ? "https://hook.eu2.make.com/ei2yht8fyfehnmxuiwg7lywdyjjrdq1k"
          : "https://hook.eu2.make.com/n7mjppwwiiukfko32x5z1gvgwmgb4zg7";

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

      setAnalysisId(analysisRecord.id);

      toast({
        title: "Analysis Started",
        description:
          "Your resume is being analyzed. Results will be available soon.",
      });

      timeoutId.current = setTimeout(() => {
        setIsTimeout(true);
        setIsProcessing(false);

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
    return (
      <div className="w-64 h-64 mx-auto">
        <Lottie options={loadingOptions} />
      </div>
    );
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

        <ResumeUploader
          onUploadSuccess={handleFileUploadSuccess}
          onResumeSelect={handleResumeSelection}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          onRemove={handleResetResume}
        />

        {hasResumeReady && (
          <JobDescriptionInput
            onSubmit={handleJobSubmit}
            isProcessing={isProcessing}
            isGenerationComplete={isGenerationComplete}
          />
        )}

        {analysisId && (
          <ProcessingPreview
            analysisId={analysisId}
            jobUrl=""
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
