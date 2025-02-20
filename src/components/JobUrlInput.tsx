// import React, { useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { useToast } from "@/hooks/use-toast";
// import { Loader2, AlertCircle } from "lucide-react";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";

// interface JobUrlInputProps {
//   onUrlSubmit: (url: string) => void;
//   isProcessing?: boolean;
//   jobUrl?: string;
//   setJobUrl?: (url: string) => void;
//   resumeId?: string;
//   setIsProcessing?: (isProcessing: boolean) => void;
// }

// const SUPPORTED_JOB_SITES = [
//   // Restricted Platforms (URLs with 'search' not allowed)
//   { domain: "linkedin.com", restricted: true },
//   { domain: "jobsdb.com", restricted: true },
//   // Unrestricted Platforms (all URLs allowed)
//   { domain: "indeed.com", restricted: false },
//   { domain: "glassdoor.com", restricted: false },
//   { domain: "foundit", restricted: false },
//   { domain: "ziprecruiter.com", restricted: false },
//   { domain: "simplyhired.com", restricted: false },
//   { domain: "104.com.tw", restricted: false },
//   { domain: "1111.com.tw", restricted: false },
//   { domain: "next.rikunabi.com", restricted: false },
//   { domain: "51job.com", restricted: false }
// ];

// const JobUrlInput = ({ onUrlSubmit, isProcessing = false, jobUrl = "", setJobUrl, resumeId, setIsProcessing }: JobUrlInputProps) => {
//   const [url, setUrl] = useState(jobUrl);
//   const [showUnsupportedDialog, setShowUnsupportedDialog] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const { toast } = useToast();

//   const isValidJobUrl = (url: string): boolean => {
//     try {
//       const urlObj = new URL(url);
//       const urlString = url.toLowerCase();
//       const hostname = urlObj.hostname.toLowerCase();
//       const pathname = urlObj.pathname.toLowerCase();
      
//       // Find matching site
//       const matchingSite = SUPPORTED_JOB_SITES.find(site => hostname.includes(site.domain));
      
//       if (!matchingSite) {
//         setShowUnsupportedDialog(true);
//         return false;
//       }

//       // Check for search URLs in restricted sites - only check the pathname
//       if (matchingSite.restricted && pathname.includes('search')) {
//         toast({
//           title: "Invalid URL",
//           description: `Search URLs are not allowed for ${matchingSite.domain}. Please use direct job posting URLs.`,
//           variant: "destructive",
//         });
//         return false;
//       }

//       return true;
//     } catch {
//       toast({
//         title: "Invalid URL",
//         description: "Please enter a valid URL",
//         variant: "destructive",
//       });
//       return false;
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!isValidJobUrl(url)) {
//       return;
//     }
//     setIsSubmitting(true);
//     if (setJobUrl) setJobUrl(url);
//     if (setIsProcessing) setIsProcessing(true);
//     await onUrlSubmit(url);
//     setIsSubmitting(false);
//     setUrl("");
//   };

//   return (
//     <>
//       <Card className="w-full">
//         <CardHeader>
//           <CardTitle>Job Posting URL</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="flex gap-2">
//             <Input
//               type="url"
//               placeholder="Paste job posting URL here"
//               value={url}
//               onChange={(e) => setUrl(e.target.value)}
//               className="flex-1"
//               disabled={isProcessing || isSubmitting}
//             />
//             <Button type="submit" disabled={isProcessing || isSubmitting}>
//               {isSubmitting ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Processing
//                 </>
//               ) : (
//                 'Cast Alchemy'
//               )}
//             </Button>
//           </form>
//         </CardContent>
//       </Card>

//       <AlertDialog open={showUnsupportedDialog} onOpenChange={setShowUnsupportedDialog}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle className="flex items-center gap-2">
//               <AlertCircle className="h-5 w-5 text-destructive" />
//               Unsupported Website
//             </AlertDialogTitle>
//             <AlertDialogDescription className="space-y-4">
//               <p>The provided URL is not from one of our supported job platforms. We currently support:</p>
              
//               <div className="space-y-2">
//                 <p className="font-semibold">Global Platforms:</p>
//                 <ul className="list-disc pl-6 space-y-1">
//                   <li>LinkedIn (linkedin.com) - No search URLs allowed</li>
//                   <li>Indeed (indeed.com)</li>
//                   <li>Glassdoor (glassdoor.com)</li>
//                   <li>Foundit (foundit.in, foundit.hk)</li>
//                   <li>ZipRecruiter (ziprecruiter.com)</li>
//                   <li>SimplyHired (simplyhired.com)</li>
//                 </ul>
//               </div>

//               <div className="space-y-2">
//                 <p className="font-semibold">Asian Regional Platforms:</p>
//                 <ul className="list-disc pl-6 space-y-1">
//                   <li>104 Job Bank (104.com.tw)</li>
//                   <li>1111 Job Bank (1111.com.tw)</li>
//                   <li>JobsDB (jobsdb.com) - No search URLs allowed</li>
//                   <li>Rikunabi NEXT (next.rikunabi.com)</li>
//                   <li>51job (51job.com)</li>
//                 </ul>
//               </div>
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogAction>I Understand</AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </>
//   );
// };

// export default JobUrlInput;



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

const SUPPORTED_JOB_SITES = [
  // Restricted Platforms (URLs with 'search' not allowed)
  { domain: "linkedin.com", restricted: true },
  { domain: "jobsdb.com", restricted: true },
  // Unrestricted Platforms (all URLs allowed)
  { domain: "indeed.com", restricted: false },
  { domain: "glassdoor.com", restricted: false },
  { domain: "foundit", restricted: false },
  { domain: "ziprecruiter.com", restricted: false },
  { domain: "simplyhired.com", restricted: false },
  { domain: "104.com.tw", restricted: false },
  { domain: "1111.com.tw", restricted: false },
  { domain: "next.rikunabi.com", restricted: false },
  { domain: "51job.com", restricted: false }
];

const JobUrlInput = ({ onUrlSubmit, isProcessing = false, jobUrl = "", setJobUrl, resumeId, setIsProcessing }: JobUrlInputProps) => {
  const [url, setUrl] = useState(jobUrl);
  const [showUnsupportedDialog, setShowUnsupportedDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const isValidJobUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const urlString = url.toLowerCase();
      const hostname = urlObj.hostname.toLowerCase();
      const pathname = urlObj.pathname.toLowerCase();
      const searchParams = urlObj.searchParams;
      
      // Find matching site
      const matchingSite = SUPPORTED_JOB_SITES.find(site => hostname.includes(site.domain));
      
      if (!matchingSite) {
        setShowUnsupportedDialog(true);
        return false;
      }

      // Check for search URLs in restricted sites - check both pathname and search parameters
      if (matchingSite.restricted && (pathname.includes('search') || searchParams.has('keywords') || searchParams.has('q'))) {
        toast({
          title: "Invalid URL",
          description: `Search URLs are not allowed for ${matchingSite.domain}. Please use direct job posting URLs.`,
          variant: "destructive",
        });
        return false;
      }

      // Additional validation for specific platforms
      if (hostname.includes('linkedin.com')) {
        if (!pathname.includes('/jobs/view/')) {
          toast({
            title: "Invalid LinkedIn URL",
            description: "Please use a direct job posting URL from LinkedIn (should contain '/jobs/view/').",
            variant: "destructive",
          });
          return false;
        }
      }

      return true;
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidJobUrl(url)) {
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
              Unsupported Website
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>The provided URL is not from one of our supported job platforms. We currently support:</p>
              
              <div className="space-y-2">
                <p className="font-semibold">Global Platforms:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>LinkedIn (linkedin.com) - No search URLs allowed</li>
                  <li>Indeed (indeed.com)</li>
                  <li>Glassdoor (glassdoor.com)</li>
                  <li>Foundit (foundit.in, foundit.hk)</li>
                  <li>ZipRecruiter (ziprecruiter.com)</li>
                  <li>SimplyHired (simplyhired.com)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-semibold">Asian Regional Platforms:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>104 Job Bank (104.com.tw)</li>
                  <li>1111 Job Bank (1111.com.tw)</li>
                  <li>JobsDB (jobsdb.com) - No search URLs allowed</li>
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