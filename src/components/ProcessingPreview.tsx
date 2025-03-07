
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

const ProcessingPreview = ({ 
  analysisId,
  jobUrl,
  resumeId,
  setIsProcessing,
  onGenerationComplete
}: ProcessingPreviewProps) => {
  const [progress, setProgress] = useState(10);
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);
  const [isGenerationDone, setIsGenerationDone] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!analysisId && !resumeId) return;

    console.log('Setting up ProcessingPreview for analysis:', analysisId || resumeId);

    // Initial fetch of the analysis
    const fetchAnalysis = async () => {
      console.log('Fetching initial analysis data...');
      const { data, error } = await supabase
        .from("resume_analyses")
        .select("google_doc_url")
        .eq("id", analysisId || resumeId)
        .single();

      if (error) {
        console.error("Error fetching analysis:", error);
        return;
      }

      console.log('Initial analysis data:', data);
      if (data?.google_doc_url) {
        console.log('Found existing Google Doc URL:', data.google_doc_url);
        setGoogleDocUrl(data.google_doc_url);
        setProgress(100);
        setIsGenerationDone(true);
        if (onGenerationComplete) onGenerationComplete();
      }
    };

    fetchAnalysis();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`analysis-${analysisId || resumeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resume_analyses',
          filter: `id=eq.${analysisId || resumeId}`,
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          
          if (payload.eventType === 'UPDATE') {
            const newData = payload.new;
            console.log('Analysis update received:', newData);

            if (newData.google_doc_url && !googleDocUrl) {
              setGoogleDocUrl(newData.google_doc_url);
              setProgress(100);
              setIsGenerationDone(true);
              if (onGenerationComplete) onGenerationComplete();
              toast({
                title: "Analysis Complete!",
                description: "Your customized resume is now ready",
              });
            }
            
            if (newData.analysis_data) {
              setProgress(90);
              console.log('Analysis data received:', newData.analysis_data);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to updates');
        }
      });

    return () => {
      console.log('Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [analysisId, resumeId, toast, googleDocUrl, onGenerationComplete]);

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
    navigate('/alchemy-records');
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
              Your resume is being analyzed and customized. This may take a few minutes...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingPreview;
