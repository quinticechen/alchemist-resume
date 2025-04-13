
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Save, AlertTriangle, Eye, FileJson } from 'lucide-react';
import SectionSelector from './SectionSelector';
import SectionEditor from './sections/SectionEditor';
import JobDescriptionViewer from './JobDescriptionViewer';
import SeekerOptimizationSection from './SeekerOptimizationSection';
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
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
  const [sectionOrder, setSectionOrder] = useState<ResumeSection[]>(getAllSections());
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const handleSectionToggle = useCallback((section: ResumeSection) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const handleSectionsReorder = useCallback((sections: ResumeSection[]) => {
    setSectionOrder(sections);
    
    setResumeData((prevData: any) => ({
      ...prevData,
      sectionOrder: sections
    }));
  }, []);

  const handleResumeDataChange = useCallback((updatedData: any) => {
    setResumeData(updatedData);
  }, []);

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
            <ResizablePanelGroup direction="horizontal" className="h-[700px]">
              {/* Job Description (Left) */}
              <ResizablePanel defaultSize={25} minSize={15}>
                <div className="h-full p-2 overflow-y-auto">
                  <JobDescriptionViewer jobData={jobData} />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Resume Editor (Middle) */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full overflow-auto p-2">
                  <div className="mb-4 flex items-center">
                    <h3 className="text-xl font-semibold">Resume Sections</h3>
                  </div>
                  
                  <div className="lg:hidden mb-4">
                    <SectionSelector 
                      sections={sectionOrder}
                      onSectionToggle={handleSectionToggle}
                      onSectionsReorder={handleSectionsReorder}
                      collapsedSections={collapsedSections}
                    />
                  </div>
                  
                  {sectionOrder.map((section) => (
                    <SectionEditor 
                      key={section}
                      section={section} 
                      resumeData={resumeData} 
                      onChange={handleResumeDataChange}
                      isCollapsed={collapsedSections[section]}
                      onToggleCollapse={handleSectionToggle}
                      isDraggable={true}
                    />
                  ))}
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Seeker Optimization (Right) */}
              <ResizablePanel defaultSize={25} minSize={15}>
                <div className="h-full p-2 overflow-y-auto">
                  <SeekerOptimizationSection optimizationData={resumeData} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>
          
          <TabsContent value="json" className="mt-0 h-full">
            <div className="border rounded-md h-[700px]">
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
