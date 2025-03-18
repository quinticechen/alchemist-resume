
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import ResumeEditor from '@/components/alchemy-records/ResumeEditor';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ResumeRefine = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const paramAnalysisId = params.analysisId;
  const { resumeId, goldenResume, analysisId: locationAnalysisId, jobTitle } = location.state || {};
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [resumeData, setResumeData] = useState<{
    resumeId: string;
    goldenResume: string | null;
    analysisId: string;
    jobTitle?: string;
  } | null>(null);
  const { toast } = useToast();

  // Use analysis ID from URL params if available, otherwise from location state
  const analysisId = paramAnalysisId || locationAnalysisId;

  // Fetch resume data if only analysis ID is provided in URL
  useEffect(() => {
    const fetchResumeData = async () => {
      if (analysisId && !resumeId && session?.user?.id) {
        try {
          const { data, error } = await supabase
            .from('resume_analyses')
            .select('id, resume_id, golden_resume, job_title')
            .eq('id', analysisId)
            .single();
          
          if (error) throw error;
          
          if (data) {
            setResumeData({
              resumeId: data.resume_id,
              goldenResume: data.golden_resume,
              analysisId: data.id,
              jobTitle: data.job_title
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
        // If we have both IDs from location state, set the data directly
        setResumeData({
          resumeId,
          goldenResume,
          analysisId,
          jobTitle
        });
      }
    };

    if (session && analysisId) {
      fetchResumeData();
    }
  }, [session, analysisId, resumeId, goldenResume, jobTitle]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !session) {
      navigate('/login', { state: { from: '/resume-refine' } });
    }
    
    // If no analysis ID provided, go back to records
    if (!isLoading && session && !analysisId) {
      navigate('/alchemy-records');
    }

    // Handle beforeunload to warn about unsaved changes
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

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  // Don't render anything if not authenticated or no analysis ID
  if (!session || !analysisId) {
    return null;
  }

  // If we're still loading resume data
  if (!resumeData && analysisId) {
    return <div className="container mx-auto px-4 py-8">Loading resume data...</div>;
  }

  const handleClose = () => {
    // Check if there are unsaved changes
    if (hasUnsavedChanges) {
      toast({
        title: "Don't forget to save",
        description: "You have unsaved changes. Make sure to save before leaving.",
        variant: "destructive" 
      });
    } else {
      navigate('/alchemy-records');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-primary text-transparent bg-clip-text">
            Resume Refine 
            {resumeData?.jobTitle ? ` - ${resumeData.jobTitle}` : ''}
            <span className="text-sm ml-2 font-normal text-gray-500">
              ID: {analysisId}
            </span>
          </h1>
          
          <div className="bg-white rounded-xl p-6 shadow-apple min-h-[600px]">
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
    </div>
  );
};

export default ResumeRefine;
