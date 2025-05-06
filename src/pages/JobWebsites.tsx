import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getEnvironment } from "@/integrations/supabase/client";
import { PlatformCard } from "@/components/platform/PlatformCard";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ErrorMessage from "@/components/seeker/ErrorMessage";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Platform {
  id: string;
  url: string | null;
  title: string | null;
  description: string | null;
  content: Array<{ type: string; text: string }> | null;
  notion_url: string | null;
  created_time: string | null;
  attrs: any;
}

interface SyncStatus {
  hasNotionApiKey: boolean;
  hasNotionDatabaseId: boolean;
  message: string;
}

interface SyncResult {
  id: string;
  title?: string;
  status: "success" | "error";
  error?: string;
}

const JobWebsites = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [apiErrorDetails, setApiErrorDetails] = useState<string | null>(null);
  const { toast } = useToast();
  const currentEnv = getEnvironment();

  const fetchPlatforms = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("platform")
        .select("*")
        .order("created_time", { ascending: false });

      if (error) throw error;

      if (data) {
        console.log(`Fetched ${data.length} platforms:`, data.slice(0, 2));
        setPlatforms(data || []);

        // Clear the configuration error if we successfully got data
        if (data.length > 0) {
          setError(null);
        }
      }
    } catch (error) {
      console.error("Error fetching platforms:", error);
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

  const checkSyncStatus = async () => {
    try {
      console.log("Checking Notion sync status...");

      const { data, error } = await supabase.functions.invoke("notion-sync", {
        body: { action: "check-status" },
        headers: { "Content-Type": "application/json" },
      });

      if (error) {
        console.error("Error checking sync status:", error);
        setApiErrorDetails(
          `Error type: ${error.name}, Message: ${
            error.message
          }, Additional details: ${JSON.stringify(error)}`
        );
        throw error;
      }

      console.log("Sync status response:", data);
      setSyncStatus(data);

      // Only set error if we have no platforms AND the configuration is missing
      const hasMissingConfig =
        !data.hasNotionApiKey || !data.hasNotionDatabaseId;
      if (hasMissingConfig && platforms.length === 0) {
        setError(
          "Notion API key or Database ID is missing. Please configure them in Supabase Edge Function secrets."
        );
      } else {
        // Clear the error if we have platforms or the configuration is complete
        setError(null);
      }
    } catch (error) {
      console.error("Error checking sync status:", error);

      // Don't set error if we already have platforms
      if (platforms.length === 0) {
        setError("Failed to check Notion sync configuration.");
        setApiErrorDetails(`Error checking sync status: ${error.toString()}`);
      }
    }
  };

  const triggerSync = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      setApiErrorDetails(null);
      setSyncResults([]);

      console.log("Triggering Notion sync...");

      const { data, error } = await supabase.functions.invoke("notion-sync", {
        headers: { "Content-Type": "application/json" },
      });

      if (error) {
        console.error("Error syncing platforms:", error);
        setApiErrorDetails(
          `Error type: ${error.name}, Message: ${
            error.message
          }, Additional details: ${JSON.stringify(error)}`
        );
        throw error;
      }

      console.log("Sync response:", data);

      if (data.results) {
        setSyncResults(data.results);
      }

      toast({
        title: "Sync Complete",
        description:
          data?.message || "Job websites have been synchronized from Notion.",
      });

      // Refresh platforms after sync
      fetchPlatforms();
      checkSyncStatus();
    } catch (error) {
      console.error("Error syncing platforms:", error);
      setError(
        "Failed to synchronize with Notion. Please check your connection and try again."
      );
      toast({
        title: "Sync Failed",
        description:
          "There was a problem syncing with Notion. Please check your API keys and database configuration.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
    checkSyncStatus();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Job Websites</h1>
        <Button
          onClick={triggerSync}
          disabled={isSyncing}
          className="bg-gradient-primary-light text-white hover:opacity-90 transition-opacity"
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

      {syncStatus &&
        (syncStatus.hasNotionApiKey === false ||
          syncStatus.hasNotionDatabaseId === false) && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 mb-6 rounded-lg">
            <h3 className="font-medium mb-2">Configuration Status</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Notion API Key:{" "}
                {syncStatus.hasNotionApiKey ? "✅ Configured" : "❌ Missing"}
              </li>
              <li>
                Notion Database ID:{" "}
                {syncStatus.hasNotionDatabaseId
                  ? "✅ Configured"
                  : "❌ Missing"}
              </li>
            </ul>
            <p className="text-sm mt-2">
              Please make sure to configure these secrets in the Supabase Edge
              Function secrets.
            </p>
          </div>
        )}

      {apiErrorDetails && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>API Error Details</AlertTitle>
          <AlertDescription className="text-xs font-mono whitespace-pre-wrap">
            {apiErrorDetails}
          </AlertDescription>
        </Alert>
      )}

      {error && platforms.length === 0 && (
        <ErrorMessage
          message={error}
          onRetry={isLoading ? fetchPlatforms : triggerSync}
          isRetrying={isRetrying}
        />
      )}

      {syncResults.length > 0 && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium mb-2">Sync Results</h3>
          <div className="text-sm">
            <div className="flex justify-between mb-2">
              <span>
                Success:{" "}
                {syncResults.filter((r) => r.status === "success").length}
              </span>
              <span>
                Failed: {syncResults.filter((r) => r.status === "error").length}
              </span>
            </div>
            {syncResults.filter((r) => r.status === "error").length > 0 && (
              <div className="mt-2 text-red-600">
                <h4 className="font-medium">Errors:</h4>
                <ul className="list-disc pl-5 mt-1">
                  {syncResults
                    .filter((r) => r.status === "error")
                    .slice(0, 3)
                    .map((result, idx) => (
                      <li key={idx}>
                        {result.title || result.id}: {result.error}
                      </li>
                    ))}
                  {syncResults.filter((r) => r.status === "error").length >
                    3 && (
                    <li>
                      ...and{" "}
                      {syncResults.filter((r) => r.status === "error").length -
                        3}{" "}
                      more errors
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
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
              name={platform.title || "Untitled"}
              url={platform.url || "#"}
              description={platform.description || ""}
              content={platform.content || []}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg mx-auto max-w-md border border-gray-200">
            <p className="text-muted-foreground text-lg mb-4">
              No job websites found.
            </p>
            <p className="text-sm text-gray-500 mb-6">This could be because:</p>
            <ul className="text-sm text-left list-disc pl-5 mb-6 space-y-2">
              <li>The Notion sync has not been run yet</li>
              <li>
                The Notion API key or Database ID is not properly configured
              </li>
              <li>The Notion database is empty</li>
              <li>There was an error during the sync process</li>
            </ul>
            {currentEnv === "staging" && (
              <Button
                onClick={triggerSync}
                className="w-full"
                className="bg-gradient-primary-light text-white hover:opacity-90 transition-opacity"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Sync from Notion
                  </>
                )}
              </Button>
            )}
          </div>

          {syncStatus?.message && (
            <div className="text-sm text-gray-500">
              Last sync message: {syncStatus.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobWebsites;
