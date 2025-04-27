
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PlatformCard } from "@/components/platform/PlatformCard";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Platform {
  id: string;
  url: string;
  attrs: any;
}

const JobWebsites = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const fetchPlatforms = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('Platform')
        .select('*')
        .order('created_time', { ascending: false });

      if (error) throw error;
      setPlatforms(data || []);
    } catch (error) {
      console.error('Error fetching platforms:', error);
      toast({
        title: "Error fetching job websites",
        description: "There was a problem fetching the job websites data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSync = async () => {
    try {
      setIsSyncing(true);
      
      const { data, error } = await supabase.functions.invoke('notion-sync');
      
      if (error) throw error;
      
      toast({
        title: "Sync Complete",
        description: data.message || "Job websites have been synchronized from Notion.",
      });
      
      // Refresh platforms after sync
      fetchPlatforms();
    } catch (error) {
      console.error('Error syncing platforms:', error);
      toast({
        title: "Sync Failed",
        description: "There was a problem syncing with Notion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Job Websites</h1>
        <Button 
          onClick={triggerSync} 
          disabled={isSyncing}
          className="flex items-center gap-2"
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCcw className="h-4 w-4" />
              Sync from Notion
            </>
          )}
        </Button>
      </div>
      
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-gray-200 rounded-lg"/>
          ))}
        </div>
      ) : platforms.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => (
            <PlatformCard
              key={platform.id}
              name={platform.attrs?.title || 'Untitled'}
              url={platform.url || '#'}
              description={platform.attrs?.description}
              attrs={platform.attrs}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">No job websites found.</p>
          <Button onClick={triggerSync}>Sync from Notion</Button>
        </div>
      )}
    </div>
  );
};

export default JobWebsites;
