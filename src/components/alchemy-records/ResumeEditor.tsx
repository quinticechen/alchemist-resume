
import React, { useState, useEffect, useCallback, FC } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Save, AlertTriangle, Eye, FileJson, ChevronDown, ChevronUp, GripVertical, Lock } from 'lucide-react';
import SectionSelector from './SectionSelector';
import SectionEditor from './sections/SectionEditor';
import JobDescriptionViewer from './JobDescriptionViewer';
import SeekerOptimizationSection from './SeekerOptimizationSection';
import { ResumeSection, getFormattedResume, getAllSections, getSectionDisplayName } from '@/utils/resumeUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResumeData } from '@/types/resume';

interface ResumeEditorProps {
  resumeId?: string;
  goldenResume?: string | ResumeData;
  analysisId?: string;
  setHasUnsavedChanges?: (value: boolean) => void;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

interface JobData {
  job_title?: string;
  company_name?: string;
  job_description?: string;
}

const ResumeEditor: FC<ResumeEditorProps> = ({ 
  resumeId, 
  goldenResume, 
  analysisId, 
  setHasUnsavedChanges,
  activeSection: initialActiveSection,
  onSectionChange: parentSectionChangeHandler
}) => {
  const [resumeData, setResumeData] = useState<ResumeData>({
    resume: {
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
        linkedIn: ''
      },
      professionalSummary: '',
      professionalExperience: [],
      education: [],
      skills: { technical: [], soft: [] },
      projects: [],
      volunteer: [],
      certifications: [],
      guidanceForOptimization: []
    },
    sectionOrder: getAllSections()
  });
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedData, setSavedData] = useState<string | null>(null);
  const [hasUnsavedChanges, setLocalHasUnsavedChanges] = useState<boolean>(false);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
  const [sectionOrder, setSectionOrder] = useState<ResumeSection[]>(getAllSections());
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (sectionOrder.length > 0) {
      const newSectionOrder = [...sectionOrder];
      
      const personalInfoIndex = newSectionOrder.indexOf('personalInfo');
      const expIndex = newSectionOrder.indexOf('professionalExperience');
      
      if (personalInfoIndex > -1) {
        newSectionOrder.splice(personalInfoIndex, 1);
      }
      
      if (expIndex > -1) {
        newSectionOrder.splice(expIndex > personalInfoIndex && personalInfoIndex > -1 ? expIndex - 1 : expIndex, 1);
      }
      
      if (expIndex > -1) {
        newSectionOrder.unshift('professionalExperience');
      }
      
      newSectionOrder.unshift('personalInfo');
      
      setSectionOrder(newSectionOrder);
      
      const initialCollapsedState: Record<string, boolean> = {};
      newSectionOrder.forEach((section, index) => {
        initialCollapsedState[section] = index !== 0;
      });
      setCollapsedSections(initialCollapsedState);
    }
  }, []);

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
            // Ensure we're using the correct typed array
            const typedSectionOrder: ResumeSection[] = content.sectionOrder.filter((section: string) => 
              getAllSections().includes(section as ResumeSection)
            ) as ResumeSection[];
            
            setSectionOrder(typedSectionOrder);
            
            const initialCollapsedState: Record<string, boolean> = {};
            typedSectionOrder.forEach((section: ResumeSection, index: number) => {
              initialCollapsedState[section] = (index !== 0 && section !== 'professionalExperience');
            });
            setCollapsedSections(initialCollapsedState);
          }
          
          setResumeData(content as ResumeData);
          setSavedData(JSON.stringify(content));
          setEditorId(editorData.id);
        } else {
          let initialContent: ResumeData = {
            resume: {
              personalInfo: {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                location: '',
                linkedIn: ''
              },
              professionalSummary: '',
              professionalExperience: [],
              education: [],
              skills: { technical: [], soft: [] },
              projects: [],
              volunteer: [],
              certifications: [],
              guidanceForOptimization: []
            },
            sectionOrder: getAllSections()
          };
          
          if (goldenResume) {
            try {
              const parsedContent = typeof goldenResume === 'string' 
                ? JSON.parse(goldenResume) 
                : goldenResume;
              
              initialContent = parsedContent as ResumeData;
            } catch (e) {
              console.error("Failed to parse golden resume:", e);
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
    const contentChanged = JSON.stringify(resumeData) !== savedData && savedData !== null;
    setLocalHasUnsavedChanges(contentChanged);
    setHasUnsavedChanges(contentChanged);
  }, [resumeData, savedData, setHasUnsavedChanges]);

  const handleSectionToggle = (sectionId: ResumeSection) => {
    setCollapsedSections(prev => {
      const newSet = { ...prev };
      if (newSet[sectionId]) {
        delete newSet[sectionId];
      } else {
        newSet[sectionId] = true;
      }
      return newSet;
    });
  };

  const handleSectionsReorder = async (result: DropResult) => {
    if (!result.destination) return;

    // Prevent dragging the personalInfo section
    if (result.draggableId === 'personalInfo') {
      return;
    }

    const items = Array.from(sectionOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Ensure personalInfo is always at index 0
    const personalInfoIndex = items.indexOf('personalInfo');
    if (personalInfoIndex > 0) {
      items.splice(personalInfoIndex, 1);
      items.unshift('personalInfo');
    }

    setSectionOrder(items);
    setLocalHasUnsavedChanges(true);
    setHasUnsavedChanges(true);

    try {
      const { data: editorData, error: fetchError } = await supabase
        .from('resume_editors')
        .select('content')
        .eq('analysis_id', analysisId)
        .single();

      if (fetchError) throw fetchError;

      const content = editorData?.content as ResumeData || {};
      const updatedContent = {
        ...content,
        sectionOrder: items
      };

      const { error: updateError } = await supabase
        .from('resume_editors')
        .update({ content: updatedContent })
        .eq('analysis_id', analysisId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error saving section order:', error);
    }
  };

  const handleDataChange = (newData: ResumeData) => {
    setResumeData(newData);
    setLocalHasUnsavedChanges(true);
    setHasUnsavedChanges(true);
  };

  const handleSectionOrderChange = (newOrder: ResumeSection[]) => {
    setResumeData(prevData => ({
      ...prevData,
      sectionOrder: newOrder
    }));
    setLocalHasUnsavedChanges(true);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resumeData),
      });

      if (!response.ok) {
        throw new Error('Failed to save resume');
      }

      setLocalHasUnsavedChanges(false);
      setHasUnsavedChanges(false);
      showToast('Resume saved successfully');
    } catch (error) {
      console.error('Error saving resume:', error);
      showToast('Failed to save resume', 'error');
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
      setResumeData(parsed as ResumeData);
    } catch (error) {
      console.error("Invalid JSON:", error);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    // Prevent dragging personalInfo section
    if (result.draggableId === 'personalInfo') {
      return;
    }
    
    const items = Array.from(sectionOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Ensure personalInfo is always at index 0
    const personalInfoIndex = items.indexOf('personalInfo');
    if (personalInfoIndex > 0) {
      items.splice(personalInfoIndex, 1);
      items.unshift(personalInfo);
    }
    
    handleSectionsReorder(result);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    toast({
      title: type === 'success' ? 'Success' : 'Error',
      description: message,
      variant: type === 'error' ? 'destructive' : 'default',
    });
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading editor...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'visual' | 'json')} className="h-full">
          <TabsContent value="visual" className="mt-0 h-full">
            <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-200px)]">
              <ResizablePanel defaultSize={25} minSize={15}>
                <ScrollArea className="h-full">
                  <div className="h-full p-2">
                    <JobDescriptionViewer jobData={jobData} />
                  </div>
                </ScrollArea>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={50} minSize={30}>
                <ScrollArea className="h-full">
                  <div className="p-2">
                    <div className="lg:hidden mb-4">
                      <SectionSelector 
                        sections={sectionOrder}
                        onSectionToggle={handleSectionToggle}
                        onSectionsReorder={handleSectionOrderChange}
                        collapsedSections={collapsedSections}
                      />
                    </div>
                    
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="resume-sections">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-4"
                          >
                            {sectionOrder.map((sectionId, index) => (
                              <Draggable 
                                key={sectionId} 
                                draggableId={sectionId} 
                                index={index}
                                isDragDisabled={sectionId === 'personalInfo'}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="mb-4 rounded-lg shadow-sm"
                                  >
                                    <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-t-lg border-b border-neutral-200">
                                      <div className="flex items-center gap-2">
                                        {sectionId === 'personalInfo' ? (
                                          <Lock className="h-4 w-4 text-neutral-400" />
                                        ) : (
                                          <div {...provided.dragHandleProps}>
                                            <GripVertical className="h-4 w-4 text-neutral-400" />
                                          </div>
                                        )}
                                        <h2 className="text-md font-semibold">{getSectionDisplayName(sectionId)}</h2>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSectionToggle(sectionId)}
                                      >
                                        {collapsedSections[sectionId] ? (
                                          <ChevronDown className="h-4 w-4" />
                                        ) : (
                                          <ChevronUp className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                    {!collapsedSections[sectionId] && (
                                      <div>
                                        <SectionEditor
                                          section={sectionId}
                                          resumeData={resumeData}
                                          onChange={handleDataChange}
                                          isCollapsed={collapsedSections[sectionId]}
                                          onToggleCollapse={handleSectionToggle}
                                          isDraggable={sectionId !== 'personalInfo'}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                </ScrollArea>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={25} minSize={15}>
                <ScrollArea className="h-full">
                  <div className="p-2">
                    <SeekerOptimizationSection 
                      optimizationData={resumeData} 
                      analysisId={analysisId}
                    />
                  </div>
                </ScrollArea>
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>
          
          <TabsContent value="json" className="mt-0 h-full">
            <div className="border rounded-md h-[calc(100vh-200px)]">
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
                onClick={handleSave}
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
