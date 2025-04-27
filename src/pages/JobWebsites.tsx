
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PlatformCard } from "@/components/platform/PlatformCard";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ErrorMessage from "@/components/seeker/ErrorMessage";

interface Platform {
  id: string;
  url: string;
  attrs: any;
}

const JobWebsites = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const { toast } = useToast();

  const fetchPlatforms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('Platform')
        .select('*')
        .order('created_time', { ascending: false });

      if (error) throw error;
      
      if (data) {
        console.log(`Fetched ${data.length} platforms`, data.slice(0, 2));
        setPlatforms(data || []);
      }
    } catch (error) {
      console.error('Error fetching platforms:', error);
      setError("Failed to load job websites. Please try again later.");
      toast({
        title: "Error fetching job websites",
        description: "There was a problem fetching the job websites data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  const triggerSync = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('notion-sync');
      
      if (error) throw error;
      
      toast({
        title: "Sync Complete",
        description: data?.message || "Job websites have been synchronized from Notion.",
      });
      
      // Refresh platforms after sync
      fetchPlatforms();
    } catch (error) {
      console.error('Error syncing platforms:', error);
      setError("Failed to synchronize with Notion. Please check your connection and try again.");
      toast({
        title: "Sync Failed",
        description: "There was a problem syncing with Notion. Please check your API keys and database configuration.",
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
      
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={isLoading ? fetchPlatforms : triggerSync}
          isRetrying={isRetrying}
        />
      )}
      
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
