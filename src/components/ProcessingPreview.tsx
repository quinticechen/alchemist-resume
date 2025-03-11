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

const ProcessingPreview = ({
  analysisId,
  jobUrl,
  isProcessing,
  setIsProcessing,
  onGenerationComplete,
  isTimeout = false,
}: ProcessingPreviewProps) => {
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);
  const [goldenResume, setGoldenResume] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>("pending");
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

  // Set up initial state and subscription
  useEffect(() => {
    if (!analysisId) return;

    setStatus("pending");

    // Initial fetch of the analysis
    const fetchAnalysis = async () => {
      try {
        const { data, error } = await supabase
          .from("resume_analyses")
          .select("google_doc_url, golden_resume, match_score, error, status")
          .eq("id", analysisId)
          .single();

        if (error) {
          console.error("Error fetching analysis:", error);
          setStatus("error");
          setError("Failed to fetch analysis data");
          return;
        }

        if (data?.error) {
          console.log("Found error in analysis:", data.error);
          setStatus("error");
          setError(data.error);
          if (setIsProcessing) {
            setIsProcessing(false);
          }
          toast({
            title: "Error",
            description: data.error,
            variant: "destructive",
          });
          return;
        }

        if (data?.status === "error") {
          console.log("Analysis status is error");
          setStatus("error");
          setError(data.error || "An error occurred during processing");
          if (setIsProcessing) {
            setIsProcessing(false);
          }
          toast({
            title: "Error",
            description: data.error || "Resume generation failed",
            variant: "destructive",
          });
          return;
        }

        if (data?.google_doc_url) {
          setGoogleDocUrl(data.google_doc_url);
          setGoldenResume(data.golden_resume || null);
          setMatchScore(data.match_score || null);
          setStatus("success");

          if (onGenerationComplete) {
            onGenerationComplete();
          }
        } else {
          // If no google_doc_url yet, show loading status
          setStatus("pending");
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
          console.log("Received realtime update:", payload);

          if (payload.eventType === "UPDATE") {
            const newData = payload.new;

            // Check if there's an error in the update
            if (newData.error || newData.status === "error") {
              console.log("Received error update:", newData.error);
              setStatus("error");
              setError(newData.error || "An error occurred during processing");

              toast({
                title: "Error",
                description: newData.error || "Resume generation failed",
                variant: "destructive",
              });

              if (setIsProcessing) {
                setIsProcessing(false);
              }
              return;
            }

            // Check if google_doc_url is now available
            if (newData.google_doc_url) {
              setGoogleDocUrl(newData.google_doc_url);
              setGoldenResume(newData.golden_resume || null);
              setMatchScore(newData.match_score || null);
              setStatus("success");

              toast({
                title: "Resume generation complete",
                description: "Your customized resume is ready to view",
              });

              if (onGenerationComplete) {
                onGenerationComplete();
              }
            } else if (newData.analysis_data && !newData.google_doc_url) {
              // Update if we have analysis_data but not yet a google_doc_url
              // Continue in loading state
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [analysisId, toast, onGenerationComplete, setIsProcessing]);

  // Don't render anything if not processing
  if (!isProcessing) {
    return null;
  }

  // If there's a timeout, display the Failed animation with timeout message
  if (isTimeout) {
    return (
      <div className="w-full text-center mt-4">
        <div className="py-8">
          <div className="w-64 h-64 mx-auto">
            <Lottie options={failedOptions} />
          </div>
          <p className="mt-4 text-gray-600">
            Resume generation took too long. Please try again later.
          </p>
        </div>
      </div>
    );
  }

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

        {status === "error" && (
          <div className="py-8">
            <div className="w-64 h-64 mx-auto">
              <Lottie options={failedOptions} />
            </div>
            <p className="mt-4 text-gray-600">
              {error || "An error occurred during processing."}
            </p>
          </div>
        )}
        {status === "timeout" && (
          <div className="py-8">
            <div className="w-64 h-64 mx-auto">
              <Lottie options={failedOptions} />
            </div>
            <p className="mt-4 text-gray-600">
              {error || "An error occurred during processing."}
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
