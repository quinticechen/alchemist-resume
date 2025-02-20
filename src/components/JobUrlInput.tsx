
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface JobUrlInputProps {
  onUrlSubmit: (url: string) => void;
  isProcessing?: boolean;
  jobUrl?: string;
  setJobUrl?: (url: string) => void;
  resumeId?: string;
  setIsProcessing?: (isProcessing: boolean) => void;
}

const URL_PATTERNS = {
  'linkedin.com': {
    valid: /^https:\/\/www\.linkedin\.com\/jobs\/view\/\d+$/,
    example: 'https://www.linkedin.com/jobs/view/4143525421'
  },
  'indeed.com': {
    valid: /^https:\/\/www\.indeed\.com\/viewjob\?jk=[a-zA-Z0-9]+/,
    example: 'https://www.indeed.com/viewjob?jk=723d3d2eaf66b3d6'
  },
  'glassdoor.com': {
    valid: /^https:\/\/www\.glassdoor\.com\/Job\/.*?jobListingId=\d+/,
    example: 'https://www.glassdoor.com/Job/[title]-jobs-SRCH_KO0,32.htm?jobListingId=1009505372887'
  },
  'foundit.hk': {
    valid: /^https:\/\/www\.foundit\.hk\/job\/.*?\d+$/,
    example: 'https://www.foundit.hk/job/cloud-solution-engineer-database-taiwan-oracle-taiwan-34014328'
  },
  'ziprecruiter.com': {
    valid: /^https:\/\/www\.ziprecruiter\.com\/c\/.*?\/Job\/.*?\?jid=[a-zA-Z0-9]+$/,
    example: 'https://www.ziprecruiter.com/c/Company/Job/Position/-in-Location?jid=87dd15916c0ab9fd'
  },
  'simplyhired.com': {
    valid: /^https:\/\/www\.simplyhired\.com\/job\/[a-zA-Z0-9_-]+$/,
    example: 'https://www.simplyhired.com/job/aaX8W0nMMZnVcWZNZboPTamlBMsvfGKsH2-PJBEINlt_I-ldD6DHsA'
  },
  '104.com.tw': {
    valid: /^https:\/\/www\.104\.com\.tw\/job\/[a-zA-Z0-9]+/,
    example: 'https://www.104.com.tw/job/8mq0p'
  },
  '1111.com.tw': {
    valid: /^https:\/\/www\.1111\.com\.tw\/job\/\d+\/?$/,
    example: 'https://www.1111.com.tw/job/85115614/'
  },
  'jobsdb.com': {
    valid: /^https:\/\/[a-z]+\.jobsdb\.com\/job\/.*?[a-zA-Z0-9]{32}/,
    example: 'https://sg.jobsdb.com/job/[title]-[id]'
  },
  'next.rikunabi.com': {
    valid: /^https:\/\/next\.rikunabi\.com\/company\/.*?\/nx\d+_[a-zA-Z0-9]+\//,
    example: 'https://next.rikunabi.com/company/cmi0167304069/nx1_rq0020358736/'
  },
  '51job.com': {
    valid: /^https:\/\/jobs\.51job\.com\/.*?\/\d+\.html/,
    example: 'https://jobs.51job.com/shanghai-pdxq/161830554.html'
  }
};

const SUPPORTED_JOB_SITES = [
  // Global Platforms
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
  "foundit.hk",
  "ziprecruiter.com",
  "simplyhired.com",
  // Asian Regional Platforms
  "104.com.tw",
  "1111.com.tw",
  "jobsdb.com",
  "next.rikunabi.com",
  "51job.com"
];

const JobUrlInput = ({ onUrlSubmit, isProcessing = false, jobUrl = "", setJobUrl, resumeId, setIsProcessing }: JobUrlInputProps) => {
  const [url, setUrl] = useState(jobUrl);
  const [showUnsupportedDialog, setShowUnsupportedDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const isValidJobUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      
      // Find matching site pattern
      for (const domain of SUPPORTED_JOB_SITES) {
        if (urlObj.hostname.includes(domain)) {
          const pattern = URL_PATTERNS[domain];
          if (pattern && pattern.valid.test(url)) {
            return true;
          } else {
            toast({
              title: "Invalid URL Format",
              description: `Please use the correct URL format for ${domain}. Example: ${pattern?.example}`,
              variant: "destructive",
            });
            return false;
          }
        }
      }
      
      return false;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidJobUrl(url)) {
      setShowUnsupportedDialog(true);
      return;
    }
    setIsSubmitting(true);
    if (setJobUrl) setJobUrl(url);
    if (setIsProcessing) setIsProcessing(true);
    await onUrlSubmit(url);
    setIsSubmitting(false);
    setUrl("");
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Job Posting URL</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="url"
              placeholder="Paste job posting URL here"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              disabled={isProcessing || isSubmitting}
            />
            <Button type="submit" disabled={isProcessing || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                'Cast Alchemy'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={showUnsupportedDialog} onOpenChange={setShowUnsupportedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Unsupported Website or Invalid URL Format
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>The provided URL is not from one of our supported job platforms or doesn't follow the required format. We currently support:</p>
              
              <div className="space-y-2">
                <p className="font-semibold">Global Platforms:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>LinkedIn (linkedin.com)</li>
                  <li>Indeed (indeed.com)</li>
                  <li>Glassdoor (glassdoor.com)</li>
                  <li>Foundit (foundit.hk)</li>
                  <li>ZipRecruiter (ziprecruiter.com)</li>
                  <li>SimplyHired (simplyhired.com)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-semibold">Asian Regional Platforms:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>104 Job Bank (104.com.tw)</li>
                  <li>1111 Job Bank (1111.com.tw)</li>
                  <li>JobsDB (jobsdb.com)</li>
                  <li>Rikunabi NEXT (next.rikunabi.com)</li>
                  <li>51job (51job.com)</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>I Understand</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default JobUrlInput;
