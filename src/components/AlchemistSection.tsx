import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AlchemistSectionProps {
  resumeId?: string;
}

const AlchemistSection = ({ resumeId }: AlchemistSectionProps) => {
  const { toast } = useToast();
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!resumeId) return;

    console.log('Setting up AlchemistSection for resume:', resumeId);

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
        }
      } catch (error) {
        console.error("Error fetching analysis:", error);
        toast({
          title: "Error",
          description: "Failed to fetch analysis results",
          variant: "destructive",
        });
      }
    };

    fetchAnalysis();

    // Subscribe to real-time updates
    console.log('Setting up real-time subscription...');
    const channel = supabase
      .channel(`resume-analysis-${resumeId}`)
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
      console.log('Cleaning up subscription for resume:', resumeId);
      supabase.removeChannel(channel);
    };
  }, [resumeId, toast]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ResumeAlchemist Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {googleDocUrl 
              ? "Your enhanced resume is ready! Click below to view it in Google Docs."
              : "Your resume is being processed. Please wait..."}
          </p>
          {googleDocUrl && (
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
      </CardContent>
    </Card>
  );
};

export default AlchemistSection;