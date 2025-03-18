
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import ResumeEditor from '@/components/alchemy-records/ResumeEditor';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ResumeRefine = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { resumeId, goldenResume, analysisId, jobTitle } = location.state || {};
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !session) {
      navigate('/login', { state: { from: '/resume-refine' } });
    }
    
    // If no analysis ID provided, go back to records
    if (!isLoading && !analysisId) {
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

  const handleClose = () => {
    // Check if there are unsaved changes
    supabase
      .from('resume_editors')
      .select('*')
      .eq('analysis_id', analysisId)
      .single()
      .then(({ data, error }) => {
        if (!error && data && hasUnsavedChanges) {
          toast({
            title: "Don't forget to save",
            description: "You have unsaved changes. Make sure to save before leaving.",
            variant: "destructive" // Changed from "warning" to "destructive" as it's a valid variant
          });
        } else {
          navigate('/alchemy-records');
        }
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-primary text-transparent bg-clip-text">
            Resume Refine {jobTitle ? `- ${jobTitle}` : ''}
          </h1>
          
          <div className="bg-white rounded-xl p-6 shadow-apple min-h-[600px]">
            <ResumeEditor 
              resumeId={resumeId} 
              goldenResume={goldenResume}
              analysisId={analysisId}
              onClose={handleClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeRefine;
