
import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AlchemistSectionProps {
  resumeId?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

type ProcessingStatus = "idle" | "loading" | "error" | "success";

const AlchemistSection = ({ resumeId, title, description, children }: AlchemistSectionProps) => {
  const { toast } = useToast();
  const [googleDocUrl, setGoogleDocUrl] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<ProcessingStatus>("idle");

  useEffect(() => {
    if (!resumeId) return;

    console.log('Setting up AlchemistSection for resume:', resumeId);
    setStatus("loading");

    // Initial fetch of the analysis
    const fetchAnalysis = async () => {
      console.log('Fetching initial analysis data...');
      try {
        const { data, error } = await supabase
          .from("resume_analyses")
          .select("google_doc_url")
          .eq("resume_id", resumeId)
          .maybeSingle();

        if (error) throw error;
        
        console.log('Initial analysis data:', data);
        if (data?.google_doc_url) {
          console.log('Found existing Google Doc URL:', data.google_doc_url);
          setGoogleDocUrl(data.google_doc_url);
          setStatus("success");
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
    const timeoutId = setTimeout(() => {
      if (status === "loading") {
        console.log('Processing timeout reached');
        setStatus("error");
        toast({
          title: "Processing Timeout",
          description: "Update failed, please try again later",
          variant: "destructive",
        });
      }
    }, 60000); // 1 minute timeout

    // Subscribe to real-time updates
    console.log('Setting up real-time subscription...');
    const channel = supabase
      .channel(`resume_analyses_${resumeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resume_analyses',
          filter: `resume_id=eq.${resumeId}`,
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newGoogleDocUrl = payload.new.google_doc_url;
            console.log('New Google Doc URL from update:', newGoogleDocUrl);
            if (newGoogleDocUrl && newGoogleDocUrl !== googleDocUrl) {
              setGoogleDocUrl(newGoogleDocUrl);
              setStatus("success");
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
      console.log('Cleaning up subscription and timeout for resume:', resumeId);
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [resumeId, toast]);

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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title || "ResumeAlchemist Results"}
        </CardTitle>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {children || (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {status === "loading" && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              <p className="text-sm text-gray-600">
                {getStatusMessage()}
              </p>
            </div>
            {status === "success" && googleDocUrl && (
              <Button
                onClick={() => window.open(googleDocUrl, '_blank')}
                className="w-full sm:w-auto"
                variant="outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Enhanced Resume
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlchemistSection;
