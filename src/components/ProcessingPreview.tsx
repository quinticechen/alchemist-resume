
import React, { useEffect, useState } from "react";
import { History, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Lottie from "react-lottie";
import Loading from "@/animations/Loading.json";
import Failed from "@/animations/Failed.json";

interface ProcessingPreviewProps {
  analysisId: string;
  jobUrl?: string;
  isProcessing?: boolean;
  setIsProcessing?: (isProcessing: boolean) => void;
  onGenerationComplete?: () => void;
  isTimeout?: boolean;
}

type ProcessingStatus = "pending" | "error" | "timeout" | "success";

// Define an interface for the data shape we expect from Supabase
interface AnalysisData {
  google_doc_url: string | null;
  match_score: number | null;
  error: string | null;
  status: ProcessingStatus | null;
}

const ProcessingPreview = ({
  analysisId,
  jobUrl,
  isProcessing,
  setIsProcessing,
  onGenerationComplete,
  isTimeout = false,
}: ProcessingPreviewProps) => {
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>(isTimeout ? "timeout" : "pending");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Animation configuration options
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

  // Reset state when analysisId changes
  useEffect(() => {
    setGoogleDocUrl(null);
    setMatchScore(null);
    setStatus(isTimeout ? "timeout" : "pending");
    setError(null);
  }, [analysisId, isTimeout]);

  // Debugging log
  useEffect(() => {
    if (analysisId) {
      console.log(`ProcessingPreview: Monitoring analysis ${analysisId} with status ${status}`);
    }
  }, [analysisId, status]);

  // Set up subscription and initial fetch
  useEffect(() => {
    if (!analysisId) return;
    
    // If timeout is externally set, update the status
    if (isTimeout) {
      setStatus("timeout");
      return;
    }

    // Initial fetch of the analysis
    const fetchAnalysis = async () => {
      try {
        console.log(`Fetching analysis data for ID: ${analysisId}`);
        const { data, error: fetchError } = await supabase
          .from("resume_analyses")
          .select("google_doc_url, match_score, error, status")
          .eq("id", analysisId)
          .maybeSingle();

        if (fetchError) {
          console.error("Error fetching analysis:", fetchError);
          setStatus("error");
          setError("Failed to fetch analysis data");
          return;
        }

        console.log("Fetched analysis data:", data);

        // Handle case when no data is found
        if (!data) {
          console.log("No data found for analysis ID:", analysisId);
          return;
        }

        // Safely cast data to our expected type
        const analysisData = data as AnalysisData;

        if (analysisData.error || analysisData.status === "error") {
          setStatus("error");
          setError(analysisData.error || "An error occurred during processing");
          if (setIsProcessing) {
            setIsProcessing(false);
          }
          return;
        }

        if (analysisData.status === "timeout") {
          setStatus("timeout");
          setError(analysisData.error || "Resume generation timed out. Please try again later.");
          if (setIsProcessing) {
            setIsProcessing(false);
          }
          return;
        }

        if (analysisData.google_doc_url) {
          console.log("Google Doc URL found, setting success state:", analysisData.google_doc_url);
          setGoogleDocUrl(analysisData.google_doc_url);
          setMatchScore(analysisData.match_score);
          setStatus("success");
          if (onGenerationComplete) {
            onGenerationComplete();
          }
        } else {
          setStatus("pending");
        }
      } catch (error) {
        console.error("Exception in fetchAnalysis:", error);
        setStatus("error");
        setError("Failed to fetch analysis results");
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
          console.log("Real-time update received:", payload);
          
          // Cast the new data to our expected type for type safety
          const newData = payload.new as AnalysisData;

          // Check if there's an error in the update
          if (newData.error || newData.status === "error") {
            console.log("Error status detected in real-time update");
            setStatus("error");
            setError(newData.error || "An error occurred during processing");

            if (setIsProcessing) {
              setIsProcessing(false);
            }
            return;
          }

          // Check if status is timeout
          if (newData.status === "timeout") {
            console.log("Timeout status detected in real-time update");
            setStatus("timeout");
            setError(newData.error || "Resume generation took too long. Please try again later.");
            if (setIsProcessing) {
              setIsProcessing(false);
            }
            return;
          }

          // Check if google_doc_url is now available
          if (newData.google_doc_url) {
            console.log("Success status detected in real-time update");
            setGoogleDocUrl(newData.google_doc_url);
            setMatchScore(newData.match_score);
            setStatus("success");

            toast({
              title: "Resume generation complete",
              description: "Your customized resume is ready to view",
            });

            if (onGenerationComplete) {
              onGenerationComplete();
            }
          } else if (newData.status === "success") {
            // Handle case where status is success but google_doc_url might be delayed
            console.log("Success status but no Google Doc URL yet, checking again...");
            fetchAnalysis();
          }
        }
      )
      .subscribe();

    return () => {
      console.log(`Unsubscribing from channel for analysis ${analysisId}`);
      supabase.removeChannel(channel);
    };
  }, [analysisId, toast, onGenerationComplete, setIsProcessing, isTimeout]);

  // Always render the component based on status
  return (
    <div className="w-full text-center mt-4">
      <div className="text-xl flex flex-col items-center">
        {status === "pending" && (
          <div className="py-8">
            <div className="w-64 h-64 mx-auto">
              <Lottie options={loadingOptions} />
            </div>
            <p className="mt-4 text-gray-600">
              Your resume is being alchemized. Please wait a few minutes...
            </p>
          </div>
        )}

        {(status === "error" || status === "timeout") && (
          <div className="py-8">
            <div className="w-64 h-64 mx-auto">
              <Lottie options={failedOptions} />
            </div>
            <p className="mt-4 text-gray-600">
              {status === "timeout"
                ? "Resume generation took too long. Please try again later."
                : error || "An error occurred during processing."}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {status === "success" && googleDocUrl && (
          <div className="flex text-center flex-wrap gap-3 pt-2 justify-center">
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
              size="sm"
              onClick={() => navigate("/alchemy-records")}
              className="text-primary border-primary/20 hover:bg-primary/5"
            >
              <History className="h-4 w-4 mr-2" />
              View All Records
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingPreview;
