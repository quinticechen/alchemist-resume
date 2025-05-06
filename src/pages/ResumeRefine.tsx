
import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ResumeEditor from "@/components/alchemy-records/ResumeEditor";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Lottie from "react-lottie";
import Loading from "@/animations/Loading.json";

interface JobData {
  job_title?: string;
}

const ResumeRefine = () => {
  const loadingOptions = {
    loop: true,
    autoplay: true,
    animationData: Loading,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const paramAnalysisId = params.analysisId;
  const {
    resumeId,
    goldenResume,
    analysisId: locationAnalysisId,
    jobTitle,
    section,
  } = location.state || {};
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [activeSectionContent, setActiveSectionContent] = useState<string>("");
  const [resumeData, setResumeData] = useState<{
    resumeId: string;
    goldenResume: string | null;
    analysisId: string;
    jobTitle?: string;
  } | null>(null);
  const [jobDescription, setJobDescription] = useState<any>(null);
  const { toast } = useToast();
  const [headerHeight, setHeaderHeight] = useState(72); // Set to 72px as specified

  const analysisId = paramAnalysisId || locationAnalysisId;

  // Set body height to 100vh and remove overflow to make the page full height
  useEffect(() => {
    // Set body to full height and remove overflow
    document.body.style.height = "100vh";
    document.body.style.overflow = "hidden";
    
    // Clean up function
    return () => {
      document.body.style.height = "";
      document.body.style.overflow = "";
    };
  }, []);

  // Effect to measure actual header height if needed
  useEffect(() => {
    const measureHeaderHeight = () => {
      const headerElement = document.querySelector('.page-header');
      if (headerElement) {
        const headerRect = headerElement.getBoundingClientRect();
        setHeaderHeight(headerRect.height);
      }
    };
    
    // Initial measurement
    measureHeaderHeight();
    
    // Re-measure on resize
    window.addEventListener('resize', measureHeaderHeight);
    return () => window.removeEventListener('resize', measureHeaderHeight);
  }, [resumeData]);

  useEffect(() => {
    if (analysisId) {
      localStorage.setItem("currentAnalysisId", analysisId);
    }
  }, [analysisId]);

  useEffect(() => {
    const fetchResumeData = async () => {
      if (analysisId && !resumeId && session?.user?.id) {
        try {
          console.log(`Fetching resume data for analysis ID: ${analysisId}`);

          const { data: analysisData, error: analysisError } = await supabase
            .from("resume_analyses")
            .select("id, resume_id, job_id, job:job_id(job_title)")
            .eq("id", analysisId)
            .single();

          if (analysisError) throw analysisError;

          if (analysisData) {
            console.log(
              `Found analysis data: resume_id=${analysisData.resume_id}, job_id=${analysisData.job_id}`
            );

            const jobId = analysisData.job_id;
            if (jobId) {
              const { data: jobData, error: jobError } = await supabase
                .from("jobs")
                .select("job_description")
                .eq("id", jobId)
                .single();

              if (jobError) throw jobError;

              if (jobData) {
                setJobDescription(jobData.job_description);
              }
            }

            const { data: editorData, error: editorError } = await supabase
              .from("resume_editors")
              .select("content")
              .eq("analysis_id", analysisId)
              .single();

            if (editorError) throw editorError;

            console.log("Editor data:", editorData);

            let resumeContent = null;
            if (editorData?.content) {
              resumeContent = JSON.stringify(editorData.content, null, 2);
              console.log("Formatted content:", resumeContent);
            }

            let fetchedJobTitle: string | null = null;

            if (analysisData.job) {
              if (Array.isArray(analysisData.job)) {
                if (
                  analysisData.job.length > 0 &&
                  typeof analysisData.job[0] === "object"
                ) {
                  fetchedJobTitle = analysisData.job[0].job_title || null;
                }
              } else if (
                typeof analysisData.job === "object" &&
                analysisData.job !== null
              ) {
                fetchedJobTitle =
                  (analysisData.job as JobData).job_title || null;
              }
            }

            setResumeData({
              resumeId: analysisData.resume_id,
              goldenResume: resumeContent,
              analysisId: analysisData.id,
              jobTitle: fetchedJobTitle,
            });
          }
        } catch (error) {
          console.error("Error fetching resume data:", error);
          toast({
            title: "Error",
            description: "Could not fetch resume data. Please try again.",
            variant: "destructive",
          });
          navigate("/alchemy-records");
        }
      } else if (resumeId && analysisId) {
        let formattedGoldenResume = goldenResume;

        if (goldenResume) {
          try {
            const parsedContent = JSON.parse(goldenResume);
            formattedGoldenResume = JSON.stringify(parsedContent, null, 2);
          } catch {
            formattedGoldenResume = goldenResume;
          }
        }

        setResumeData({
          resumeId,
          goldenResume: formattedGoldenResume,
          analysisId,
          jobTitle,
        });
      }
    };

    const savedAnalysisId = localStorage.getItem("currentAnalysisId");

    if (session) {
      if (analysisId) {
        fetchResumeData();
      } else if (savedAnalysisId) {
        navigate(`/resume-refine/${savedAnalysisId}`);
      }
    }
  }, [session, analysisId, resumeId, goldenResume, jobTitle, navigate, toast]);

  useEffect(() => {
    if (!isLoading && !session) {
      if (analysisId) {
        localStorage.setItem(
          "redirectAfterLogin",
          `/resume-refine/${analysisId}`
        );
      } else {
        localStorage.setItem("redirectAfterLogin", "/resume-refine");
      }
      navigate("/login", { state: { from: "/resume-refine" } });
    }

    if (!isLoading && session && !analysisId) {
      const savedAnalysisId = localStorage.getItem("currentAnalysisId");
      if (savedAnalysisId) {
        navigate(`/resume-refine/${savedAnalysisId}`);
      } else {
        navigate("/alchemy-records");
      }
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        const message =
          "You have unsaved changes. Are you sure you want to leave?";
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [session, isLoading, navigate, analysisId, hasUnsavedChanges]);

  const handleSuggestionApply = useCallback(
    (text: string, sectionId: string) => {
      if (!resumeData || !text || !sectionId) return;

      toast({
        title: "Suggestion Applied",
        description: `The Ooze AI suggestion has been applied to your resume section: ${sectionId}`,
      });
    },
    [toast, resumeData]
  );

  const handleGenerateSuggestion = useCallback(
    (sectionId: string) => {
      toast({
        title: "Generating Suggestion",
        description: `Ooze is generating a suggestion for your ${sectionId} section. Check the AI chat panel for the result.`,
      });
    },
    [toast]
  );

  if (isLoading) {
    return (
      <div className="w-64 h-64 mx-auto">
        <Lottie options={loadingOptions} />
      </div>
    );
  }

  if (!session || !analysisId) {
    return null;
  }

  if (!resumeData && analysisId) {
    return (
      <div className="w-64 h-64 mx-auto">
        <Lottie options={loadingOptions} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-b from-neutral-50 to-neutral-100">
      {/* Top section - Header with job title */}
      <div className="mt-[72px] page-header flex-shrink-0 py-3 px-4 border-b bg-white shadow-sm">
        <h1 className="text-2xl font-bold bg-gradient-primary text-transparent bg-clip-text text-center">
          {resumeData?.jobTitle || "Resume Editor"}
        </h1>
      </div>

      {/* Middle section - Main content */}
      <div className="flex-grow overflow-hidden">
        {resumeData && (
          <ResumeEditor
            resumeId={resumeData.resumeId}
            goldenResume={resumeData.goldenResume}
            analysisId={analysisId}
            setHasUnsavedChanges={setHasUnsavedChanges}
            pageHeaderHeight={headerHeight} // Using the measured or default header height
          />
        )}
      </div>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave without
              saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => navigate("/alchemy-records")}
              className="bg-red-500 hover:bg-red-600"
            >
              Leave without saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ResumeRefine;
