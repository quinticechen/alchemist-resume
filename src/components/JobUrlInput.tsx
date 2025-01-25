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
}

const SUPPORTED_JOB_SITES = [
  // Global Platforms
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
  "monster.com",
  "ziprecruiter.com",
  "careerbuilder.com",
  "simplyhired.com",
  // Asian Regional Platforms
  "104.com.tw",
  "1111.com.tw",
  "jobsdb.com",
  "next.rikunabi.com",
  "51job.com",
  "zhaopin.com"
];

const JobUrlInput = ({ onUrlSubmit, isProcessing = false }: JobUrlInputProps) => {
  const [url, setUrl] = useState("");
  const [showUnsupportedDialog, setShowUnsupportedDialog] = useState(false);
  const { toast } = useToast();

  const isValidJobUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return SUPPORTED_JOB_SITES.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidJobUrl(url)) {
      setShowUnsupportedDialog(true);
      return;
    }
    onUrlSubmit(url);
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
              disabled={isProcessing}
            />
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? (
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
              Unsupported Website
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>The provided URL is not from one of our supported job platforms. We currently support:</p>
              
              <div className="space-y-2">
                <p className="font-semibold">Global Platforms:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>LinkedIn (linkedin.com)</li>
                  <li>Indeed (indeed.com)</li>
                  <li>Glassdoor (glassdoor.com)</li>
                  <li>Monster (monster.com)</li>
                  <li>ZipRecruiter (ziprecruiter.com)</li>
                  <li>CareerBuilder (careerbuilder.com)</li>
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
                  <li>Zhaopin (zhaopin.com)</li>
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