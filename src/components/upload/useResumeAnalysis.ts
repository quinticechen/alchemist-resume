
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
    console.log('Setting up realtime subscription for resume analyses');
    
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
          console.log('Received realtime update:', payload);
          if (payload.new && 'analysis_data' in payload.new && payload.new.analysis_data) {
            toast({
              title: "分析完成",
              description: "您的簡歷分析已準備就緒！",
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Subscription ${channelName} status:`, status);
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to ${channelName}`);
        }
      });

    // Cleanup function
    return () => {
      console.log(`Cleaning up realtime subscription for ${channelName}`);
      supabase.removeChannel(channel).then(() => {
        console.log(`Successfully cleaned up ${channelName} subscription`);
      });
    };
  }, [toast]); // Only re-run if toast changes
};
