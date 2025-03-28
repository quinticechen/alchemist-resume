
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import ResumeEditor from '@/components/alchemy-records/ResumeEditor';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Define a more precise type for job data
interface JobData {
  job_title?: string;
}

const ResumeRefine = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const paramAnalysisId = params.analysisId;
  const { resumeId, goldenResume, analysisId: locationAnalysisId, jobTitle } = location.state || {};
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [resumeData, setResumeData] = useState<{
    resumeId: string;
    goldenResume: string | null;
    analysisId: string;
    jobTitle?: string;
  } | null>(null);
  const { toast } = useToast();

  const analysisId = paramAnalysisId || locationAnalysisId;

  useEffect(() => {
    const fetchResumeData = async () => {
      if (analysisId && !resumeId && session?.user?.id) {
        try {
          const { data, error } = await supabase
            .from('resume_analyses')
            .select('id, resume_id, formatted_golden_resume, job:job_id(job_title)')
            .eq('id', analysisId)
            .single();
          
          if (error) throw error;
          
          if (data) {
            // Get the formatted_golden_resume
            let resumeContent = null;
            
            if (data.formatted_golden_resume) {
              resumeContent = JSON.stringify(data.formatted_golden_resume, null, 2);
            }
            
            // Extract job title safely, handling all possible data shapes from Supabase
            let fetchedJobTitle: string | null = null;
            
            if (data.job) {
              // Case 1: job is an array (happens with some Supabase joins)
              if (Array.isArray(data.job)) {
                if (data.job.length > 0 && typeof data.job[0] === 'object') {
                  // Access first array element's job_title
                  fetchedJobTitle = data.job[0].job_title || null;
                }
              } 
              // Case 2: job is an object (direct relation)
              else if (typeof data.job === 'object' && data.job !== null) {
                fetchedJobTitle = (data.job as JobData).job_title || null;
              }
            }
            
            setResumeData({
              resumeId: data.resume_id,
              goldenResume: resumeContent,
              analysisId: data.id,
              jobTitle: fetchedJobTitle
            });
          }
        } catch (error) {
          console.error('Error fetching resume data:', error);
          toast({
            title: "Error",
            description: "Could not fetch resume data. Please try again.",
            variant: "destructive"
          });
          navigate('/alchemy-records');
        }
      } else if (resumeId && analysisId) {
        // Format goldenResume if it's provided directly through location state
        let formattedGoldenResume = goldenResume;
        
        if (goldenResume) {
          try {
            // Check if it's already JSON and format it
            const parsedContent = JSON.parse(goldenResume);
            formattedGoldenResume = JSON.stringify(parsedContent, null, 2);
          } catch {
            // If parsing fails, use raw string
            formattedGoldenResume = goldenResume;
          }
        }
        
        setResumeData({
          resumeId,
          goldenResume: formattedGoldenResume,
          analysisId,
          jobTitle
        });
      }
    };

    if (session && analysisId) {
      fetchResumeData();
    }
  }, [session, analysisId, resumeId, goldenResume, jobTitle, navigate, toast]);

  useEffect(() => {
    if (!isLoading && !session) {
      navigate('/login', { state: { from: '/resume-refine' } });
    }
    
    if (!isLoading && session && !analysisId) {
      navigate('/alchemy-records');
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        const message = "You have unsaved changes. Are you sure you want to leave?";
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session, isLoading, navigate, analysisId, hasUnsavedChanges]);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!session || !analysisId) {
    return null;
  }

  if (!resumeData && analysisId) {
    return <div className="container mx-auto px-4 py-8">Loading resume data...</div>;
  }

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate('/alchemy-records');
    }
  };

  const handleConfirmClose = () => {
    setShowUnsavedDialog(false);
    navigate('/alchemy-records');
  };

  const handleCancelClose = () => {
    setShowUnsavedDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-primary text-transparent bg-clip-text">
            Resume Refine 
            {resumeData?.jobTitle ? ` - ${resumeData.jobTitle}` : ''}
            <span className="text-sm ml-2 font-normal text-gray-500">
              ID: {analysisId}
            </span>
          </h1>
          
          <div className="bg-white rounded-xl p-6 shadow-apple">
            {resumeData && (
              <ResumeEditor 
                resumeId={resumeData.resumeId} 
                goldenResume={resumeData.goldenResume}
                analysisId={analysisId}
                onClose={handleClose}
                setHasUnsavedChanges={setHasUnsavedChanges}
              />
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose} className="bg-red-500 hover:bg-red-600">
              Leave without saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ResumeRefine;
