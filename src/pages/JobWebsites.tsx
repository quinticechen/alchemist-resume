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

      console.log("Fetching platforms from Supabase (platform_content)...");
      const { data: platformContentData, error: platformContentError } = await supabase
        .from('platform_content')
        .select(`
          id: platform_id,
          url,
          title,
          description,
          content,
          notion_url
        `);

      if (platformContentError) {
        console.error("Error fetching job websites:", platformContentError);
        throw platformContentError;
      }

      if (platformContentData) {
        const fetchedPlatforms = platformContentData.map(p => ({
          id: p.id, // 使用 platform_id 作为平台的 id (已在 select 中 alias 为 id)
          url: p.url || '#',
          content: {
            title: p.title || '',
            description: p.description || '',
            content: p.content || '',
            url: p.url,
          },
          notion_url: p.notion_url || '',
          attrs: {}, // 你不再需要 attrs，可以设置为空对象
        }));
        setPlatforms(fetchedPlatforms);
      }
    } catch (error: any) {
      console.error('Error fetching platforms:', error);
      setError("Failed to load job websites. Please try again later.");
      toast({
        title: "Error fetching job websites",
        description: error.message || "There was a problem fetching the job websites data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const { error: syncError } = await supabase.functions.invoke('notion-sync');
      if (syncError) {
        throw syncError;
      }
      toast({
        title: "Sync successful!",
        description: "Job websites data has been updated.",
      });
      fetchPlatforms();
    } catch (error: any) {
      console.error('Error syncing:', error);
      setError("Failed to synchronize with Notion. Please check your connection and try again.");
      toast({
        title: "Sync failed",
        description: error.message || "There was an error during synchronization.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetry = () => {
    setIsRetrying(true);
    fetchPlatforms();
    setTimeout(() => setIsRetrying(false), 2000); // Simulate retry delay
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={triggerSync} disabled={isSyncing}>
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCcw className="mr-2 h-4 w-4" />
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
            <div key={n} className="h-32 bg-gray-200 rounded-lg" />
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