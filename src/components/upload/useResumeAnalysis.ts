
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type ResumeAnalysis = Database['public']['Tables']['resume_analyses']['Row'];
type ResumeAnalysisPayload = RealtimePostgresChangesPayload<ResumeAnalysis>;

export const useResumeAnalysis = () => {
  const { toast } = useToast();

  useEffect(() => {
    // console.log('Setting up realtime subscription for resume analyses');
    
    // Create a stable channel name
    const channelName = 'resume_analyses_updates';
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'resume_analyses',
        },
        (payload: ResumeAnalysisPayload) => {
          // console.log('Received realtime update:', payload);
          
          // Check for error first
          if (payload.new && 'error' in payload.new && payload.new.error) {
            console.error('Analysis error received:', payload.new.error);
            toast({
              title: "Analysis Error",
              description: typeof payload.new.error === 'string' ? payload.new.error : "An error occurred during resume analysis",
              variant: "destructive",
            });
            return;
          }
          
          // If no error, check for success (google_doc_url)
          if (payload.new && 'google_doc_url' in payload.new && payload.new.google_doc_url) {
            toast({
              title: "Analysis Complete",
              description: "Your resume analysis is ready!",
            });
          } else if (payload.new && 'analysis_data' in payload.new && payload.new.analysis_data) {
            // console.log("Analysis data received, processing in progress");
          }
        }
      )
      .subscribe((status) => {
        // console.log(`Subscription ${channelName} status:`, status);
        if (status === 'SUBSCRIBED') {
          // console.log(`Successfully subscribed to ${channelName}`);
        }
      });

    // Cleanup function
    return () => {
      // console.log(`Cleaning up realtime subscription for ${channelName}`);
      supabase.removeChannel(channel).then(() => {
        // console.log(`Successfully cleaned up ${channelName} subscription`);
      });
    };
  }, [toast]); // Only re-run if toast changes
};
