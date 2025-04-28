
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PlatformCard } from "@/components/platform/PlatformCard";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ErrorMessage from "@/components/seeker/ErrorMessage";

interface Platform {
  id: string;
  url: string;
  attrs: any;
  content?: {
    title: string;
    description: string;
    content: string;
    url?: string;
  };
}

const JobWebsites = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPlatforms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Fetching platforms from Supabase...");
      const { data: platformData, error: platformError } = await supabase
        .from('platform')
        .select(`
          id,
          url,
          attrs,
          platform_content (
            title,
            description,
            content,
            url
          )
        `);

      if (platformError) {
        console.error("Error fetching platforms:", platformError);
        throw platformError;
      }
      
      if (platformData) {
        console.log("Received platform data:", platformData.length);
        const platforms = platformData.map(p => ({
          ...p,
          content: p.platform_content?.[0] || null
        }));
        setPlatforms(platforms);
        
        // If no platforms found, check sync status silently
        if (platforms.length === 0) {
          try {
            console.log("No platforms found, checking sync status...");
            const { data, error } = await supabase.functions.invoke('notion-sync', {
              body: { action: 'check-status' },
            });
            
            if (error) {
              console.error("Error checking sync status:", error);
              setError("Unable to check Notion sync status. Please ensure the Edge Function is properly deployed.");
              return;
            }
            
            // Only show prompt if configuration is valid but no data
            if (data?.hasNotionApiKey && data?.hasNotionDatabaseId) {
              setError("No job websites found. Please sync with Notion to load job websites.");
            } else {
              setError("Notion API key or Database ID is missing. Please configure them in Supabase Edge Function secrets.");
            }
          } catch (error) {
            console.error('Error checking sync status:', error);
            setError("Failed to check Notion sync configuration. Please try again later.");
          }
        }
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
    }
  };

  const checkSyncStatus = async (showErrors = true) => {
    try {
      console.log('Checking Notion sync status...');
      const { data, error } = await supabase.functions.invoke('notion-sync', {
        body: { action: 'check-status' },
      });
      
      if (error) {
        console.error('Error checking sync status:', error);
        if (showErrors) {
          setError("Failed to check Notion sync configuration. Please ensure the Edge Function is properly deployed.");
        }
        return false;
      }
      
      if (!data?.hasNotionApiKey || !data?.hasNotionDatabaseId) {
        if (showErrors) {
          setError("Notion API key or Database ID is missing. Please configure them in Supabase Edge Function secrets.");
        }
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking sync status:', error);
      if (showErrors) {
        setError("Failed to check Notion sync configuration. Please try again later.");
      }
      return false;
    }
  };

  const triggerSync = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      
      // Check if configuration is valid before proceeding
      const isConfigured = await checkSyncStatus();
      if (!isConfigured) {
        setIsSyncing(false);
        return;
      }
      
      console.log("Triggering Notion sync...");
      // Invoke the Notion sync function
      const { data, error } = await supabase.functions.invoke('notion-sync', {
        body: { action: 'sync' }
      });
      
      if (error) {
        console.error('Sync error:', error);
        throw new Error(`Sync failed: ${error.message || 'Unknown error'}`);
      }
      
      console.log("Sync completed:", data);
      toast({
        title: "Sync Complete",
        description: data?.message || "Job websites have been synchronized from Notion.",
      });
      
      // Fetch the updated platforms
      await fetchPlatforms();
    } catch (error) {
      console.error('Error syncing platforms:', error);
      setError("Failed to synchronize with Notion. Please check your connection and try again.");
      toast({
        title: "Sync Failed",
        description: "There was a problem syncing with Notion.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetry = () => {
    setIsRetrying(true);
    triggerSync().finally(() => setIsRetrying(false));
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-primary text-transparent bg-clip-text">
          Job Websites
        </h1>
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
        <div className="mb-6">
          <ErrorMessage 
            message={error} 
            onRetry={handleRetry} 
            isRetrying={isRetrying} 
          />
        </div>
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
              platform={platform}
              onViewContent={(content) => setSelectedContent(content)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No job websites found.</p>
          {!error && (
            <p className="text-sm text-gray-500 mt-2">
              Click the "Sync from Notion" button to load job websites.
            </p>
          )}
        </div>
      )}

      <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Content</DialogTitle>
          </DialogHeader>
          <div className="mt-4 prose max-w-none">
            {selectedContent?.split('\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobWebsites;
