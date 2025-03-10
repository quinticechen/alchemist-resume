import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, FileText, History, Crown, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProcessingPreviewProps {
  analysisId: string;
  jobUrl?: string;
  isProcessing?: boolean;
  setIsProcessing?: (isProcessing: boolean) => void;
  onGenerationComplete?: () => void;
}

type ProcessingStatus = "idle" | "loading" | "error" | "success";

const ProcessingPreview = ({
  analysisId,
  jobUrl,
  isProcessing,
  setIsProcessing,
  onGenerationComplete,
}: ProcessingPreviewProps) => {
  const [progress, setProgress] = useState(10);
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Set up initial state and subscription
  useEffect(() => {
    if (!analysisId) return;

    setStatus("loading");

    // Begin progress animation immediately
    setProgress(15);

    // Initial fetch of the analysis
    const fetchAnalysis = async () => {
      try {
        const { data, error } = await supabase
          .from("resume_analyses")
          .select("google_doc_url, error")
          .eq("id", analysisId)
          .single();

        if (error) {
          setStatus("error");
          setError("Failed to fetch analysis data");
          return;
        }

        if (data?.error) {
          setStatus("error");
          setError(data.error);
          toast({
            title: "Error",
            description: data.error,
            variant: "destructive",
          });
          return;
        }

        if (data?.google_doc_url) {
          setGoogleDocUrl(data.google_doc_url);
          setStatus("success");
          setProgress(100);

          if (onGenerationComplete) {
            onGenerationComplete();
          }
        } else {
          // If no google_doc_url yet, show loading status
          setStatus("loading");
        }
      } catch (error) {
        console.error("Error fetching analysis:", error);
        setStatus("error");
        setError("Failed to fetch analysis results");
        toast({
          title: "Error",
          description: "Failed to fetch analysis results",
          variant: "destructive",
        });
      }
    };

    fetchAnalysis();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`analysis-${analysisId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "resume_analyses",
          filter: `id=eq.${analysisId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const newData = payload.new;

            // Check for errors first
            if (newData.error) {
              console.error("Error in analysis:", newData.error);
              setStatus("error");
              setError(newData.error);
              toast({
                title: "Generation Failed",
                description: newData.error,
                variant: "destructive",
              });

              // Notify parent component
              if (onGenerationComplete) {
                onGenerationComplete();
              }
              return;
            }

            // Check if google_doc_url is now available
            if (newData.google_doc_url) {
              setGoogleDocUrl(newData.google_doc_url);
              setStatus("success");
              setProgress(100);

              if (onGenerationComplete) {
                onGenerationComplete();
              }
            } else if (newData.analysis_data && !newData.google_doc_url) {
              // Update progress if we have analysis_data but not yet a google_doc_url
              setProgress(90);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [analysisId, toast, onGenerationComplete]);

  // Message to display based on current status
  const getStatusMessage = () => {
    if (error) return error;

    switch (status) {
      case "loading":
        return "Processing your resume...";
      case "error":
        return "Update failed, please try again later";
      case "success":
        return "Your enhanced resume is ready!";
      default:
        return "Waiting to process your resume...";
    }
  };

  // Continuous progress updates while waiting for the result
  useEffect(() => {
    if (status === "loading" && progress < 90) {
      const timer = setInterval(() => {
        setProgress((prev) => {
          // Gradually increase progress, but never reach 90 until we get analysis_data
          const increment = Math.max(1, Math.floor(5 * Math.random()));
          return Math.min(prev + increment, 85);
        });
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [status, progress]);

  // Don't render anything if not processing
  if (!isProcessing) {
    return null;
  }
};

export default ProcessingPreview;
