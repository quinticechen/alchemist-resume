import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { getEnvironment } from "@/integrations/supabase/client";

interface JobUrlInputProps {
  onUrlSubmit: (url: string, jobId?: string) => Promise<void>;
  isProcessing?: boolean;
  jobUrl?: string;
  setJobUrl?: (url: string) => void;
  resumeId?: string;
  setIsProcessing?: (isProcessing: boolean) => void;
  isGenerationComplete?: boolean;
}

export const SUPPORTED_JOB_SITES = [
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
  "foundit",
  "ziprecruiter.com",
  "simplyhired.com",
  "104.com.tw",
  "1111.com.tw",
  "jobsdb.com",
  "next.rikunabi.com",
  "51job.com",
];

// Environment-specific webhook URLs
export const getWebhookUrl = () => {
  const env = getEnvironment();
  if (env === "production") {
    return "https://hook.eu2.make.com/pthisc4aefvf15i7pj4ja99a84dp7kce";
  } else {
    return "https://hook.eu2.make.com/2up5vi5mr8jhhdl1eclyw3shu99uoxlb";
  }
};

const JobUrlInput = ({
  onUrlSubmit,
  isProcessing = false,
  jobUrl = "",
  setJobUrl,
  resumeId,
  setIsProcessing,
  isGenerationComplete = false,
}: JobUrlInputProps) => {
  const [url, setUrl] = useState(jobUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const validateAndProcessJobUrl = async (url: string) => {
    try {
      let processedUrl = url;
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      if (
        !hostname.includes("indeed.com") &&
        !hostname.includes("ziprecruiter.com")
      ) {
        processedUrl = url.split("?")[0];
      }

      const isValidUrl = SUPPORTED_JOB_SITES.some((site) =>
        hostname.includes(site)
      );

      // if (!isValidUrl || url.includes("search")) {
      //   toast({
      //     title: "Invalid URL",
      //     description:
      //       "This URL contains multiple or no job information, or search URLs are not allowed.",
      //     variant: "destructive",
      //   });
      //   return;
      // }
      if (!isValidUrl) {
        toast({
          title: "Invalid URL",
          description: "This URL is not from a supported site.",
          variant: "destructive",
        });
        return;
      }

      if (!hostname.includes("foundit") && url.includes("search")) {
        toast({
          title: "Invalid URL",
          description:
            "This URL contains multiple or no job information, or search URLs are not allowed.",
          variant: "destructive",
        });
        return;
      }

      if (setJobUrl) setJobUrl(processedUrl);
      if (setIsProcessing) setIsProcessing(true);
      setIsSubmitting(true);
      await onUrlSubmit(processedUrl);
      setUrl("");
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL.",
        variant: "destructive",
      });
      // console.error("URL validation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await validateAndProcessJobUrl(url);
  };

  // Input should be disabled during active processing or when generation is complete and button should be disabled
  const isInputDisabled = isProcessing || isGenerationComplete;

  // Button should be disabled during submission, when no URL is provided, during processing, or after generation is complete
  const isButtonDisabled = isSubmitting || !url || isInputDisabled;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Job Posting URL</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="url"
            placeholder="Paste job posting URL here. Remove all URL parameters from ?"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
            disabled={isInputDisabled}
          />
          <Button type="submit" disabled={isButtonDisabled}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              "Cast Alchemy"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default JobUrlInput;
