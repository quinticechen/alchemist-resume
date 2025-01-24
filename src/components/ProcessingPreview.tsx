import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProcessingPreviewProps {
  analysisId?: string;
}

const ProcessingPreview = ({ analysisId }: ProcessingPreviewProps) => {
  const [progress, setProgress] = useState(33);
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!analysisId) return;

    console.log('Setting up ProcessingPreview for analysis:', analysisId);

    // Initial fetch of the analysis
    const fetchAnalysis = async () => {
      console.log('Fetching initial analysis data...');
      const { data, error } = await supabase
        .from("resume_analyses")
        .select("google_doc_url")
        .eq("id", analysisId)
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
      }
    };

    fetchAnalysis();

    // Subscribe to real-time updates
    console.log('Setting up real-time subscription...');
    const channel = supabase
      .channel(`analysis-${analysisId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resume_analyses',
          filter: `id=eq.${analysisId}`,
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          if (payload.eventType === 'UPDATE') {
            const newGoogleDocUrl = payload.new.google_doc_url;
            console.log('New Google Doc URL from update:', newGoogleDocUrl);
            if (newGoogleDocUrl && !googleDocUrl) {
              setGoogleDocUrl(newGoogleDocUrl);
              setProgress(100);
              toast({
                title: "Resume Ready!",
                description: "Your customized resume is now available in Google Docs",
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up subscription for analysis:', analysisId);
      supabase.removeChannel(channel);
    };
  }, [analysisId, toast]);

  // Progress animation effect
  useEffect(() => {
    if (!googleDocUrl && progress < 90) {
      const timer = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [googleDocUrl, progress]);

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
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Your customized resume is ready! Click below to view and edit it in Google Docs.
              </p>
              <a
                href={googleDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <FileText className="h-4 w-4" />
                Open in Google Docs
              </a>
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