
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
  const [error, setError] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPlatforms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
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
        `)
        .order('created_time', { ascending: false });

      if (platformError) throw platformError;
      
      if (platformData) {
        const platforms = platformData.map(p => ({
          ...p,
          content: p.platform_content?.[0] || null
        }));
        setPlatforms(platforms);
        
        // If no platforms found, trigger sync
        if (platforms.length === 0) {
          checkSyncStatus();
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

  const checkSyncStatus = async () => {
    try {
      console.log('Checking Notion sync status...');
      const { data, error } = await supabase.functions.invoke('notion-sync', {
        body: { action: 'check-status' },
      });
      
      if (error) {
        console.error('Error checking sync status:', error);
        setError("Failed to check Notion sync configuration.");
        return false;
      }
      
      if (!data.hasNotionApiKey || !data.hasNotionDatabaseId) {
        setError("Notion API key or Database ID is missing. Please configure them in Supabase Edge Function secrets.");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking sync status:', error);
      setError("Failed to check Notion sync configuration.");
      return false;
    }
  };

  const triggerSync = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      
      const isConfigured = await checkSyncStatus();
      if (!isConfigured) {
        setIsSyncing(false);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('notion-sync');
      
      if (error) throw error;
      
      toast({
        title: "Sync Complete",
        description: data?.message || "Job websites have been synchronized from Notion.",
      });
      
      fetchPlatforms();
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
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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
          <p className="text-sm text-gray-500 mt-2">
            Attempting to sync with Notion...
          </p>
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
