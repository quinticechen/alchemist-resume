import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, FileText, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProcessingPreviewProps {
  analysisId?: string;
  jobUrl?: string;
  resumeId?: string;
  setIsProcessing?: (isProcessing: boolean) => void;
  onGenerationComplete?: () => void;
}

//Add ProcessingStatus
type ProcessingStatus = "idle" | "loading" | "error" | "success";

const ProcessingPreview = ({
  analysisId,
  jobUrl,
  resumeId,
  setIsProcessing,
  onGenerationComplete,
}: ProcessingPreviewProps) => {
  const [progress, setProgress] = useState(10);
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);
  const [isGenerationDone, setIsGenerationDone] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  //Add ProcessingStatus
  const [status, setStatus] = React.useState<ProcessingStatus>("idle");

  useEffect(() => {
    if (!analysisId) return;

    console.log("Setting up ProcessingPreview for analysis:", analysisId);
    //Add ProcessingStatus
    setStatus("loading");

    // Initial fetch of the analysis
    const fetchAnalysis = async () => {
      try {
        console.log("Fetching initial analysis data...");
        const { data, error } = await supabase
          .from("resume_analyses")
          .select("google_doc_url")
          .eq("id", analysisId)
          .single();

        if (error) {
          console.error("Error fetching analysis:", error);
          return;
        }

        console.log("Initial analysis data:", data);
        if (data?.google_doc_url) {
          console.log("Found existing Google Doc URL:", data.google_doc_url);
          setGoogleDocUrl(data.google_doc_url);
          //Add ProcessingStatus
          setStatus("success");
          setProgress(100);
          setIsGenerationDone(true);
          if (onGenerationComplete) onGenerationComplete();
          toast({
            // 添加這裡，如果 googleDocUrl 已經存在，則直接顯示成功通知
            title: "Analysis Complete!",
            description: "Your customized resume is now ready",
          });
        }
      } catch (error) {
        console.error("Error fetching analysis:", error);
        setStatus("error");
        toast({
          title: "Error",
          description: "Failed to fetch analysis results",
          variant: "destructive",
        });
      }
    };

    fetchAnalysis();

    // Set up timeout for error state
    // const timeoutId = setTimeout(() => {
    //   if (status === "loading") {
    //     console.log("Processing timeout reached");
    //     setStatus("error");
    //     toast({
    //       title: "Processing Timeout",
    //       description: "Update failed, please try again later",
    //       variant: "destructive",
    //     });
    //   }
    // }, 300000); // 5 minute timeout

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
          console.log("Received real-time update:", payload);

          if (payload.eventType === "UPDATE") {
            const newData = payload.new;
            console.log("Analysis update received:", newData);

            if (newData.google_doc_url && !googleDocUrl) {
              setGoogleDocUrl(newData.google_doc_url);
              //Add ProcessingStatus
              setStatus("success");
              setProgress(100);
              setIsGenerationDone(true);
              if (onGenerationComplete) onGenerationComplete();
              toast({
                title: "Alcehmist Complete!",
                description: "Your customized resume is now ready",
              });
            }

            if (newData.analysis_data) {
              setProgress(90);
              console.log("Analysis data received:", newData.analysis_data);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to updates");
        }
      });

    return () => {
      console.log("Cleaning up subscription");
      // clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [analysisId, toast, googleDocUrl, onGenerationComplete]);

  const getStatusMessage = () => {
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
    if (!googleDocUrl && progress < 90) {
      const timer = setInterval(() => {
        setProgress((prev) => {
          // Gradually increase progress, but never reach 90 until we get analysis_data
          const increment = Math.max(1, Math.floor(5 * Math.random()));
          return Math.min(prev + increment, 85);
        });
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [googleDocUrl, progress]);

  const viewAllRecords = () => {
    navigate("/alchemy-records");
  };

  return (
    <Card className="w-full animate-fade-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {googleDocUrl ? (
            <>
              <FileText className="h-5 w-5" />
              Resume Ready
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
          <Progress value={progress} className="h-2" />

          {googleDocUrl ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Your customized resume is ready! Click below to view and edit it in Google Docs.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href={googleDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <FileText className="h-4 w-4" />
                  Open in Google Docs/Golden Resume
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
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              Your resume is being analyzed and customized.
              This may take a few minutes...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingPreview;
