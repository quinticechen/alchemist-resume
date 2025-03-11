
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, History, Crown, AlertCircle } from "lucide-react";
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
}

type ProcessingStatus = "idle" | "loading" | "error" | "success";

const ProcessingPreview = ({
  analysisId,
  jobUrl,
  isProcessing,
  setIsProcessing,
  onGenerationComplete,
}: ProcessingPreviewProps) => {
  const [isTimeout, setIsTimeout] = useState(false);
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);
  const [goldenResume, setGoldenResume] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [timeoutMessage, setTimeoutMessage] = useState<string | null>(
    "Resume generation took too long. Please try again later."
  );
  const { toast } = useToast();
  const navigate = useNavigate();

  // Set up initial state and subscription
  useEffect(() => {
    if (!analysisId) return;

    setStatus("loading");

    // Initial fetch of the analysis
    const fetchAnalysis = async () => {
      try {
        const { data, error } = await supabase
          .from("resume_analyses")
          .select("google_doc_url, golden_resume, match_score")
          .eq("id", analysisId)
          .single();

        if (error) {
          console.error("Error fetching analysis:", error);
          setStatus("error");
          setError("Failed to fetch analysis data");
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
          console.log("Received realtime update:", payload);

          if (payload.eventType === "UPDATE") {
            const newData = payload.new;

            // Check if google_doc_url is now available
            if (newData.google_doc_url) {
              setGoogleDocUrl(newData.google_doc_url);
              setGoldenResume(newData.golden_resume || null);
              setMatchScore(newData.match_score || null);
              setStatus("success");
              setIsTimeout(false);

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
  }, [analysisId, toast, onGenerationComplete]);

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

  // Don't render anything if not processing
  if (!isProcessing) {
    return null;
  }

  return (
    <div className="w-full text-center mt-4">
      <div className="text-xl flex flex-col items-center">
        {status === "loading" && (
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

        {isTimeout && (
          <div className="py-8">
            <div className="w-64 h-64 mx-auto">
              <Lottie options={failedOptions} />
            </div>
            <p className="mt-4 text-gray-600">{timeoutMessage}</p>
          </div>
        )}

        <div className="mt-2">
          Resume Alchemy{" "}
          {status === "success"
            ? "Complete"
            : status === "error" || isTimeout
            ? "Failed"
            : "In Progress"}
        </div>
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
