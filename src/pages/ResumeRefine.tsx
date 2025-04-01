
import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import ResumeEditor from '@/components/alchemy-records/ResumeEditor';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ResumeSection } from '@/utils/resumeUtils';
import JellyfishDialog from "@/components/JellyfishDialog";

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
  const { resumeId, goldenResume, analysisId: locationAnalysisId, jobTitle, section } = location.state || {};
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [activeSection, setActiveSection] = useState<ResumeSection | undefined>(section as ResumeSection);
  const [resumeData, setResumeData] = useState<{
    resumeId: string;
    goldenResume: string | null;
    analysisId: string;
    jobTitle?: string;
  } | null>(null);
  const [jobDescription, setJobDescription] = useState<any>(null);
  const { toast } = useToast();

  const analysisId = paramAnalysisId || locationAnalysisId;

  useEffect(() => {
    const fetchResumeData = async () => {
      if (analysisId && !resumeId && session?.user?.id) {
        try {
          // First get the analysis record to get the resume_id
          const { data: analysisData, error: analysisError } = await supabase
            .from('resume_analyses')
            .select('id, resume_id, job:job_id(job_title)')
            .eq('id', analysisId)
            .single();
          
          if (analysisError) throw analysisError;
          
          if (analysisData) {
            // Get job description data
            if (analysisData.job_id) {
              const { data: jobData, error: jobError } = await supabase
                .from('jobs')
                .select('job_description')
                .eq('id', analysisData.job_id)
                .single();
                
              if (jobError) throw jobError;
              
              if (jobData) {
                setJobDescription(jobData.job_description);
              }
            }
            
            // Now get the editor content which has the formatted resume
            const { data: editorData, error: editorError } = await supabase
              .from('resume_editors')
              .select('content')
              .eq('analysis_id', analysisId)
              .single();
              
            if (editorError) throw editorError;
            
            // Get the formatted resume content
            let resumeContent = null;
            if (editorData?.content) {
              resumeContent = JSON.stringify(editorData.content, null, 2);
            }
            
            // Extract job title safely, handling all possible data shapes from Supabase
            let fetchedJobTitle: string | null = null;
            
            if (analysisData.job) {
              // Case 1: job is an array (happens with some Supabase joins)
              if (Array.isArray(analysisData.job)) {
                if (analysisData.job.length > 0 && typeof analysisData.job[0] === 'object') {
                  // Access first array element's job_title
                  fetchedJobTitle = analysisData.job[0].job_title || null;
                }
              } 
              // Case 2: job is an object (direct relation)
              else if (typeof analysisData.job === 'object' && analysisData.job !== null) {
                fetchedJobTitle = (analysisData.job as JobData).job_title || null;
              }
            }
            
            setResumeData({
              resumeId: analysisData.resume_id,
              goldenResume: resumeContent,
              analysisId: analysisData.id,
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

  const handleSectionChange = (section: ResumeSection) => {
    setActiveSection(section);
  };
  
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

  if (isLoading) {
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
      <JellyfishDialog 
        position="bottom" 
        title="Resume Assistant" 
        currentSectionId={activeSection}
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
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
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
