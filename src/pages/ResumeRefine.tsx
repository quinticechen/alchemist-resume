import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import ResumeEditor from '@/components/alchemy-records/ResumeEditor';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ResumeSection } from '@/utils/resumeUtils';
import JellyfishAnimation from "@/components/JellyfishAnimation";
import JellyfishDialog from "@/components/JellyfishDialog";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const { toast } = useToast();
  const [showJellyfishDialog, setShowJellyfishDialog] = useState(false);
  const [jellyfishMessage, setJellyfishMessage] = useState(
    "Let's refine this resume! I'll help you tailor it to perfection. Edit each section to highlight your most relevant skills and experience. Hmph!"
  );

  const analysisId = paramAnalysisId || locationAnalysisId;

  useEffect(() => {
    const fetchResumeData = async () => {
      if (analysisId && !resumeId && session?.user?.id) {
        try {
          const { data: analysisData, error: analysisError } = await supabase
            .from('resume_analyses')
            .select('id, resume_id, job:job_id(job_title)')
            .eq('id', analysisId)
            .single();
          
          if (analysisError) throw analysisError;
          
          if (analysisData) {
            const { data: editorData, error: editorError } = await supabase
              .from('resume_editors')
              .select('content')
              .eq('analysis_id', analysisId)
              .single();
              
            if (editorError) throw editorError;
            
            let resumeContent = null;
            if (editorData?.content) {
              resumeContent = JSON.stringify(editorData.content, null, 2);
            }
            
            let fetchedJobTitle: string | null = null;
            
            if (analysisData.job) {
              if (Array.isArray(analysisData.job)) {
                if (analysisData.job.length > 0 && typeof analysisData.job[0] === 'object') {
                  fetchedJobTitle = analysisData.job[0].job_title || null;
                }
              } else if (typeof analysisData.job === 'object' && analysisData.job !== null) {
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowJellyfishDialog(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <h1 className="text-4xl font-bold mb-8 bg-gradient-primary text-transparent bg-clip-text text-center">
              {resumeData?.jobTitle || 'Resume Editor'}
            </h1>
            
            <div className="absolute top-0 right-0">
              <JellyfishAnimation width={100} height={100} className="opacity-80" />
              <Button
                onClick={() => setShowJellyfishDialog(true)}
                variant="ghost"
                size="sm"
                className="absolute top-16 right-6 text-xs flex items-center gap-1"
              >
                <MessageCircle className="h-3 w-3" />
                Ask OOze
              </Button>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-apple">
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

      <JellyfishDialog 
        open={showJellyfishDialog} 
        onOpenChange={setShowJellyfishDialog}
        message={jellyfishMessage}
      />

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
