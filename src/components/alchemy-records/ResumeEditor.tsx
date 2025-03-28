import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Save, AlertTriangle } from 'lucide-react';
import SectionSelector from './SectionSelector';
import SectionEditor from './sections/SectionEditor';
import JobDescriptionViewer from './JobDescriptionViewer';
import { ResumeSection, getFormattedResume } from '@/utils/resumeUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ResumeEditorProps {
  resumeId: string;
  goldenResume: string | null;
  analysisId: string;
  onClose: () => void;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
}

const ResumeEditor = ({ resumeId, goldenResume, analysisId, onClose, setHasUnsavedChanges }: ResumeEditorProps) => {
  const [resumeData, setResumeData] = useState<any>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedData, setSavedData] = useState<any>(null);
  const [hasUnsavedChanges, setLocalHasUnsavedChanges] = useState<boolean>(false);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ResumeSection>('personalInfo');
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
  const { toast } = useToast();

  useEffect(() => {
    const fetchResumeAndJobData = async () => {
      setIsLoading(true);
      try {
        const { data: analysisData, error: analysisError } = await supabase
          .from('resume_analyses')
          .select('job_id')
          .eq('id', analysisId)
          .single();

        if (analysisError) throw analysisError;

        if (analysisData.job_id) {
          const { data: jobData, error: jobError } = await supabase
            .from('jobs')
            .select('job_description')
            .eq('id', analysisData.job_id)
            .single();

          if (jobError) throw jobError;
          setJobData(jobData.job_description);
        }

        const { data: editorData, error: editorError } = await supabase
          .from('resume_editors')
          .select('id, content')
          .eq('analysis_id', analysisId)
          .maybeSingle();

        if (editorError && editorError.code !== 'PGRST116') {
          throw editorError;
        }

        if (editorData) {
          const content = editorData.content;
          console.log('Editor content loaded:', content);
          setResumeData(content);
          setSavedData(JSON.stringify(content));
          setEditorId(editorData.id);
        } else {
          let initialContent = {};
          
          if (goldenResume) {
            try {
              initialContent = typeof goldenResume === 'string' 
                ? JSON.parse(goldenResume) 
                : goldenResume;
            } catch (e) {
              console.error("Failed to parse golden resume:", e);
              initialContent = {};
            }
          }
          
          const { data: newEditor, error: createError } = await supabase
            .from('resume_editors')
            .insert({
              analysis_id: analysisId,
              content: initialContent
            })
            .select('id')
            .single();
          
          if (createError) throw createError;
          
          setResumeData(initialContent);
          setSavedData(JSON.stringify(initialContent));
          setEditorId(newEditor.id);
        }
      } catch (error: any) {
        console.error('Error fetching or creating editor content:', error);
        toast({
          title: "Error",
          description: "Failed to load or initialize resume content.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (analysisId) {
      fetchResumeAndJobData();
    }
  }, [analysisId, goldenResume, toast]);

  useEffect(() => {
    const contentChanged = JSON.stringify(resumeData) !== savedData && savedData !== '';
    setLocalHasUnsavedChanges(contentChanged);
    setHasUnsavedChanges(contentChanged);
  }, [resumeData, savedData, setHasUnsavedChanges]);

  const handleSectionChange = (section: ResumeSection) => {
    setActiveSection(section);
  };

  const handleResumeDataChange = (updatedData: any) => {
    console.log('Resume data being updated:', updatedData);
    setResumeData(updatedData);
  };

  const validateResumeData = (data: any): boolean => {
    try {
      if (typeof data !== 'object' || data === null) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSaveContent = async () => {
    if (!resumeData || JSON.stringify(resumeData) === savedData || !editorId) {
      toast({
        title: "No changes to save",
        description: "You haven't made any changes to your resume.",
      });
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

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('resume_editors')
        .update({ 
          content: resumeData,
          last_saved: new Date().toISOString()
        })
        .eq('id', editorId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Resume saved successfully!",
        duration: 3000,
      });
      setSavedData(JSON.stringify(resumeData));
      setLocalHasUnsavedChanges(false);
      setHasUnsavedChanges(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRawJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const parsed = JSON.parse(e.target.value);
      setResumeData(parsed);
    } catch (error) {
      console.error("Invalid JSON:", error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading editor...</div>;
  }

  return (
    <div>
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'visual' | 'json')} className="mb-4">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="visual">Visual Editor</TabsTrigger>
          <TabsTrigger value="json">JSON Editor</TabsTrigger>
        </TabsList>
        
        <TabsContent value="visual" className="mt-4">
          <div className="grid grid-cols-[1fr_2fr_1fr] gap-4">
            <div className="border rounded-md p-4 h-[600px] overflow-auto">
              <JobDescriptionViewer jobData={jobData} />
            </div>
            
            <div className="border rounded-md p-4 h-[600px] overflow-auto">
              <h2 className="text-xl font-semibold mb-4">
                {activeSection === 'personalInfo' ? 'Personal Information' : 
                 activeSection === 'professionalSummary' ? 'Professional Summary' : 
                 activeSection === 'professionalExperience' ? 'Professional Experience' :
                 activeSection === 'education' ? 'Education' :
                 activeSection === 'skills' ? 'Skills' :
                 activeSection === 'projects' ? 'Projects' :
                 activeSection === 'volunteer' ? 'Volunteer Experience' :
                 activeSection === 'certifications' ? 'Certifications' : 'Resume Section'}
              </h2>
              <SectionEditor 
                section={activeSection} 
                resumeData={resumeData} 
                onChange={handleResumeDataChange} 
              />
            </div>
            
            <div className="border rounded-md p-4 h-[600px] overflow-auto">
              <SectionSelector 
                currentSection={activeSection} 
                onSectionChange={handleSectionChange} 
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="json" className="mt-4">
          <div className="border rounded-md">
            <textarea
              value={JSON.stringify(resumeData, null, 2)}
              onChange={handleRawJsonChange}
              className="w-full h-[600px] p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md resize-none font-mono text-base"
              placeholder="Edit your resume here in JSON format..."
            />
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between mt-4">
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>
          Close
        </Button>
        <div className="flex gap-2 items-center">
          {hasUnsavedChanges && (
            <span className="text-amber-500 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Unsaved changes
            </span>
          )}
          <Button
            onClick={handleSaveContent}
            disabled={isSaving || !hasUnsavedChanges}
            className={isSaving ? "cursor-not-allowed" : ""}
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResumeEditor;
