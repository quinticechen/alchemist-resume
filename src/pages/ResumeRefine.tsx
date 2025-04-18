
import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import ResumeEditor from '@/components/alchemy-records/ResumeEditor';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ResumeSection, getAllSections } from '@/utils/resumeUtils';
import SeekerDialog from "@/components/SeekerDialog";
import { ResumeData } from '@/types/resume';

// Define a more precise type for job data
interface JobData {
  job_title?: string;
}

interface ResumeDataState {
  resumeId: string;
  goldenResume: string | ResumeData | null;
  analysisId: string;
  jobTitle?: string;
}

const ResumeRefine = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const paramAnalysisId = params.analysisId;
  const { resumeId, goldenResume, analysisId: locationAnalysisId, jobTitle, section } = location.state || {};
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [activeSectionContent, setActiveSectionContent] = useState<string>("");
  const [resumeData, setResumeData] = useState<ResumeDataState | null>(null);
  const [jobDescription, setJobDescription] = useState<any>(null);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analysisId = paramAnalysisId || locationAnalysisId;

  // Use localStorage to preserve the current page across tab switching
  useEffect(() => {
    if (analysisId) {
      localStorage.setItem('currentAnalysisId', analysisId);
    }
  }, [analysisId]);

  useEffect(() => {
    const fetchResumeData = async () => {
      if (!analysisId) {
        setError('No analysis ID provided');
        return;
      }

      try {
        setLoading(true);
        
        // Get analysis data
        const { data: analysisData, error: analysisError } = await supabase
          .from('resume_analyses')
          .select('*')
          .eq('id', analysisId)
          .single();
        
        if (analysisError) throw analysisError;
        if (!analysisData) {
          setError('Analysis not found');
          return;
        }
        
        setResumeData({
          resumeId: analysisData.resume_id || '',
          goldenResume: analysisData.formatted_golden_resume,
          analysisId: analysisData.id,
          jobTitle: analysisData.job?.job_title
        });
        setLoading(false);
      } catch (error) {
        setError('Failed to load resume data');
        setLoading(false);
      }
    };

    fetchResumeData();
  }, [analysisId]);

  useEffect(() => {
    if (!isLoading && !session) {
      // Save the current page before redirecting
      if (analysisId) {
        localStorage.setItem('redirectAfterLogin', `/resume-refine/${analysisId}`);
      } else {
        localStorage.setItem('redirectAfterLogin', '/resume-refine');
      }
      navigate('/login', { state: { from: '/resume-refine' } });
    }
    
    if (!isLoading && session && !analysisId) {
      const savedAnalysisId = localStorage.getItem('currentAnalysisId');
      if (savedAnalysisId) {
        navigate(`/resume-refine/${savedAnalysisId}`);
      } else {
        navigate('/alchemy-records');
      }
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
  
  const handleSuggestionApply = useCallback((text: string, sectionId: string) => {
    if (!resumeData || !text || !sectionId) return;
    
    toast({
      title: "Suggestion Applied",
      description: `The suggestion has been applied to your resume.`
    });
  }, [toast, resumeData]);
  
  const handleGenerateSuggestion = useCallback((sectionId: string) => {
    toast({
      title: "Generating Suggestion",
      description: "The assistant is generating a suggestion for you. Check the AI chat panel for the result."
    });
  }, [toast]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!session || !analysisId) {
    return null;
  }

  if (!resumeData && analysisId) {
    return <div className="container mx-auto px-4 py-8">Loading resume data...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 relative">
      <SeekerDialog 
        position="bottom" 
        title="Resume Assistant" 
        onSuggestionApply={handleSuggestionApply}
        onGenerateSuggestion={handleGenerateSuggestion}
        jobData={jobDescription}
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-primary text-transparent bg-clip-text text-center">
            {resumeData?.jobTitle || 'Resume Editor'}
          </h1>
          
          <div className="bg-white rounded-xl p-6 shadow-apple mb-6">
            {resumeData && (
              <ResumeEditor 
                resumeId={resumeData.resumeId} 
                goldenResume={resumeData.goldenResume}
                analysisId={analysisId}
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
            <AlertDialogCancel onClick={() => setShowUnsavedDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/alchemy-records')} className="bg-red-500 hover:bg-red-600">
              Leave without saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ResumeRefine;
