
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

  // Debug logging for props
  useEffect(() => {
    if (analysisId) {
      console.log("ProcessingPreview initialized with analysisId:", analysisId);
    }
  }, [analysisId]);

  // Set up initial state and subscription
  useEffect(() => {
    if (!analysisId) return;
    
    console.log("Setting up processing for analysis ID:", analysisId);
    setStatus("loading");
    
    // Begin progress animation immediately
    setProgress(15);
    
    // Initial fetch of the analysis
    const fetchAnalysis = async () => {
      try {
        console.log("Fetching initial analysis data...");
        const { data, error } = await supabase
          .from("resume_analyses")
          .select("google_doc_url, error")
          .eq("id", analysisId)
          .single();

        if (error) {
          console.error("Error fetching analysis:", error);
          setStatus("error");
          setError("Failed to fetch analysis data");
          return;
        }

        console.log("Initial analysis data:", data);
        
        if (data?.error) {
          console.error("Analysis contains error:", data.error);
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
          console.log("Found existing Google Doc URL:", data.google_doc_url);
          setGoogleDocUrl(data.google_doc_url);
          setStatus("success");
          setProgress(100);
          
          if (onGenerationComplete) {
            console.log("Calling onGenerationComplete callback");
            onGenerationComplete();
          }
          
          toast({
            title: "Analysis Complete!",
            description: "Your customized resume is now ready",
          });
        } else {
          // If no google_doc_url yet, show loading status
          setStatus("loading");
          console.log("No google_doc_url yet, showing loading state");
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
    const channelName = `analysis-${analysisId}`;
    console.log(`Creating subscription channel: ${channelName}`);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "resume_analyses",
          filter: `id=eq.${analysisId}`,
        },
        (payload) => {
          console.log("Received real-time update:", payload);

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
              console.log("Google Doc URL updated:", newData.google_doc_url);
              setGoogleDocUrl(newData.google_doc_url);
              setStatus("success");
              setProgress(100);
              
              if (onGenerationComplete) {
                console.log("Calling onGenerationComplete callback");
                onGenerationComplete();
              }
              
              toast({
                title: "Resume Alchemist Complete!",
                description: "Your customized resume is now ready",
              });
            } else if (newData.analysis_data && !newData.google_doc_url) {
              // Update progress if we have analysis_data but not yet a google_doc_url
              console.log("Analysis data received, updating progress");
              setProgress(90);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for ${channelName}:`, status);
      });

    return () => {
      console.log(`Cleaning up subscription for ${channelName}`);
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
        return "Your enhanced resume is ready! Click below to view it in Google Docs.";
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

  // Navigate to records page
  const viewAllRecords = () => {
    navigate("/alchemy-records");
  };

  // Don't render anything if not processing
  if (!isProcessing) {
    return null;
  }

  return (
    <Card className="w-full animate-fade-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === "success" ? (
            <>
              <Crown className="h-5 w-5 text-amber-500" />
              Golden Resume Ready
            </>
          ) : status === "error" ? (
            <>
              <AlertCircle className="h-5 w-5 text-red-500" />
              Generation Failed
            </>
          ) : (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Resume
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {status === "loading" && (
            <Progress
              value={progress}
              className="h-2"
              aria-label="Processing progress"
            />
          )}

          <p className="text-sm text-gray-600">{getStatusMessage()}</p>

          {status === "success" && googleDocUrl && (
            <div className="flex flex-wrap gap-4">
              <a
                href={googleDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Crown className="h-4 w-4 text-amber-500" />
                Open Golden Resume
              </a>

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

          {status === "error" && (
            <Button
              variant="outline"
              onClick={() => {
                if (setIsProcessing) setIsProcessing(false);
              }}
              className="flex items-center gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingPreview;
