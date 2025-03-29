
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Save, AlertTriangle, Eye, FileJson } from 'lucide-react';
import SectionSelector from './SectionSelector';
import SectionEditor from './sections/SectionEditor';
import JobDescriptionViewer from './JobDescriptionViewer';
import { ResumeSection, getFormattedResume, getAllSections } from '@/utils/resumeUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

export interface ResumeEditorProps {
  resumeId: string;
  goldenResume: string | null;
  analysisId: string;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  activeSection?: ResumeSection;
  onSectionChange?: (section: ResumeSection) => void;
}

const ResumeEditor = ({ 
  resumeId, 
  goldenResume, 
  analysisId, 
  setHasUnsavedChanges,
  activeSection: initialActiveSection,
  onSectionChange: parentSectionChangeHandler
}: ResumeEditorProps) => {
  const [resumeData, setResumeData] = useState<any>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedData, setSavedData] = useState<any>(null);
  const [hasUnsavedChanges, setLocalHasUnsavedChanges] = useState<boolean>(false);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ResumeSection>(initialActiveSection || 'personalInfo');
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
  const [sectionOrder, setSectionOrder] = useState<ResumeSection[]>(getAllSections());
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialActiveSection) {
      setActiveSection(initialActiveSection);
    }
  }, [initialActiveSection]);

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
          
          // Extract section order if it exists
          if (content.sectionOrder && Array.isArray(content.sectionOrder)) {
            setSectionOrder(content.sectionOrder);
          }
          
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
    if (parentSectionChangeHandler) {
      parentSectionChangeHandler(section);
    }
  };

  const handleSectionsReorder = (sections: ResumeSection[]) => {
    setSectionOrder(sections);
    
    // Update the resume data with the new section order
    setResumeData((prevData: any) => ({
      ...prevData,
      sectionOrder: sections
    }));
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
      // Ensure the section order is included in the saved data
      const dataToSave = {
        ...resumeData,
        sectionOrder: sectionOrder
      };
      
      const { error } = await supabase
        .from('resume_editors')
        .update({ 
          content: dataToSave,
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
      setSavedData(JSON.stringify(dataToSave));
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

  const handlePreview = () => {
    navigate(`/resume-preview/${analysisId}`, { 
      state: { 
        resumeId, 
        goldenResume: JSON.stringify(resumeData), 
        analysisId 
      } 
    });
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
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'visual' | 'json')} className="h-full">
          <TabsContent value="visual" className="mt-0 h-full">
            <ResizablePanelGroup direction="horizontal" className="h-[600px]">
              <ResizablePanel defaultSize={25} minSize={20}>
                <div className="h-full p-2">
                  <SectionSelector 
                    currentSection={activeSection} 
                    onSectionChange={handleSectionChange} 
                    onSectionsReorder={handleSectionsReorder}
                    initialSections={resumeData?.sectionOrder || sectionOrder}
                  />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="border rounded-md p-6 h-full overflow-auto">
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
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={25} minSize={20}>
                <div className="h-full p-2">
                  <JobDescriptionViewer jobData={jobData} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>
          
          <TabsContent value="json" className="mt-0 h-full">
            <div className="border rounded-md h-[600px]">
              <textarea
                value={JSON.stringify(resumeData, null, 2)}
                onChange={handleRawJsonChange}
                className="w-full h-full p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md resize-none font-mono text-base"
                placeholder="Edit your resume here in JSON format..."
              />
            </div>
          </TabsContent>

          <div className="flex justify-between mt-4">
            <Button 
              variant="outline" 
              onClick={() => setViewMode(viewMode === 'visual' ? 'json' : 'visual')}
            >
              <FileJson className="h-4 w-4 mr-2" />
              {viewMode === 'visual' ? 'JSON Editor' : 'Visual Editor'}
            </Button>
            
            <div className="flex gap-2 items-center">
              {hasUnsavedChanges && (
                <span className="text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Unsaved changes
                </span>
              )}
              <Button
                onClick={handlePreview}
                variant="outline"
                className="ml-2"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
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
        </Tabs>
      </div>
    </div>
  );
};

export default ResumeEditor;
