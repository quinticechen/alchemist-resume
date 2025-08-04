
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SUPPORTED_JOB_SITES } from "./JobUrlInput";
import { useTranslation } from "react-i18next";

interface JobDescriptionInputProps {
  onSubmit: (data: { jobUrl?: string; jobContent?: string }) => Promise<void>;
  isProcessing?: boolean;
  isGenerationComplete?: boolean;
}

const JobDescriptionInput = ({
  onSubmit,
  isProcessing = false,
  isGenerationComplete = false,
}: JobDescriptionInputProps) => {
  const { t } = useTranslation('workshop');
  const [activeTab, setActiveTab] = useState<"url" | "text">("url");
  const [jobUrl, setJobUrl] = useState("");
  const [jobContent, setJobContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const validateJobUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      const isValidUrl = SUPPORTED_JOB_SITES.some((site) =>
        hostname.includes(site)
      );

      if (!isValidUrl) {
        toast({
          title: "Invalid URL",
          description: "This URL is not from a supported site.",
          variant: "destructive",
        });
        return false;
      }

      if (!hostname.includes("foundit") && url.includes("search")) {
        toast({
          title: "Invalid URL",
          description:
            "This URL contains multiple or no job information, or search URLs are not allowed.",
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === "url") {
      if (!jobUrl.trim()) {
        toast({
          title: "Missing URL",
          description: "Please enter a job posting URL.",
          variant: "destructive",
        });
        return;
      }

      if (!validateJobUrl(jobUrl)) {
        return;
      }

      setIsSubmitting(true);
      try {
        const processedUrl = jobUrl.split("?")[0];
        await onSubmit({ jobUrl: processedUrl });
        setJobUrl("");
      } catch (error) {
        console.error("Error submitting job URL:", error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!jobContent.trim()) {
        toast({
          title: "Missing Job Description",
          description: "Please enter a job description.",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit({ jobContent: jobContent.trim() });
        setJobContent("");
      } catch (error) {
        console.error("Error submitting job content:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isInputDisabled = isProcessing || isGenerationComplete;
  const isButtonDisabled = isSubmitting || isInputDisabled || 
    (activeTab === "url" && !jobUrl.trim()) || 
    (activeTab === "text" && !jobContent.trim());

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('jobInfo.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "url" | "text")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">{t('jobInfo.jobUrl')}</TabsTrigger>
            <TabsTrigger value="text">{t('jobInfo.jobDescription')}</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-4">
            <TabsContent value="url" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder={t('jobInfo.urlPlaceholder')}
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  className="flex-1"
                  disabled={isInputDisabled}
                />
              </div>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <Textarea
                placeholder={t('jobInfo.descriptionPlaceholder')}
                value={jobContent}
                onChange={(e) => setJobContent(e.target.value)}
                className="min-h-[120px]"
                disabled={isInputDisabled}
              />
            </TabsContent>

            <Button type="submit" disabled={isButtonDisabled} className="w-full mt-4">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                "{t('jobInfo.castAlchemy')}"
              )}
            </Button>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default JobDescriptionInput;
