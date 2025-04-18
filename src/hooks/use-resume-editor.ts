
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ResumeSection } from '@/utils/resumeUtils';

interface UseResumeEditorProps {
  resumeId: string;
  goldenResume: string | null;
  analysisId: string;
  setHasUnsavedChanges: (value: boolean) => void;
}

export const useResumeEditor = ({
  resumeId,
  goldenResume,
  analysisId,
  setHasUnsavedChanges
}: UseResumeEditorProps) => {
  const [resumeData, setResumeData] = useState<any>(null);
  const [savedData, setSavedData] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
  const [sectionOrder, setSectionOrder] = useState<ResumeSection[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const contentChanged = JSON.stringify(resumeData) !== savedData && savedData !== null;
    setHasUnsavedChanges(contentChanged);
  }, [resumeData, savedData, setHasUnsavedChanges]);

  const validateResumeData = (data: any): boolean => {
    try {
      if (typeof data !== 'object' || data === null) {
        return false;
      }
      
      if (!data.resume || typeof data.resume !== 'object') {
        console.error("Invalid resume data format: missing resume object");
        return false;
      }
      
      return true;
    } catch (e) {
      console.error("Resume validation error:", e);
      return false;
    }
  };

  const handleSaveContent = async (isAutoSave = false) => {
    if (!resumeData || JSON.stringify(resumeData) === savedData || !editorId) {
      if (!isAutoSave) {
        toast({
          title: "No changes to save",
          description: "You haven't made any changes to your resume.",
        });
      }
      return;
    }

    if (!validateResumeData(resumeData)) {
      toast({
        title: "Invalid resume format",
        description: "Please ensure your resume is properly formatted before saving.",
        variant: "destructive"
      });
      return;
    }

    if (!isAutoSave) setIsSaving(true);
    try {
      const { error } = await supabase
        .from('resume_editors')
        .update({ 
          content: resumeData,
          last_saved: new Date().toISOString()
        })
        .eq('id', editorId);

      if (error) throw error;

      if (!isAutoSave) {
        toast({
          title: "Success",
          description: "Resume saved successfully!",
          duration: 3000,
        });
      }
      
      setSavedData(JSON.stringify(resumeData));
      setHasUnsavedChanges(false);
    } catch (error: any) {
      console.error("Save error:", error);
      if (!isAutoSave) {
        toast({
          title: "Error",
          description: error.message || "Failed to save resume. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      if (!isAutoSave) setIsSaving(false);
    }
  };

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    autoSaveTimerRef.current = setTimeout(() => {
      handleSaveContent(true);
    }, 2000);
  }, []);

  const handleResumeDataChange = useCallback((updatedData: any) => {
    setResumeData(updatedData);
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const handleRawJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const parsed = JSON.parse(e.target.value);
      setResumeData(parsed);
      scheduleAutoSave();
    } catch (error) {
      console.error("Invalid JSON:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  return {
    resumeData,
    isSaving,
    viewMode,
    sectionOrder,
    collapsedSections,
    setResumeData,
    setViewMode,
    setSectionOrder,
    setCollapsedSections,
    setEditorId,
    handleSaveContent,
    handleResumeDataChange,
    handleRawJsonChange,
    scheduleAutoSave
  };
};
