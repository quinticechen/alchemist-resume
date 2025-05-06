import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Save, AlertTriangle, Eye, FileJson } from "lucide-react";
import SectionSelector from "./SectionSelector";
import SectionEditor from "./sections/SectionEditor";
import JobDescriptionViewer from "./JobDescriptionViewer";
import OozeOptimizationSection from "./OozeOptimizationSection";
import {
  ResumeSection,
  getFormattedResume,
  getAllSections,
} from "@/utils/resumeUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { ScrollArea } from "@/components/ui/scroll-area";
import Lottie from "react-lottie";
import Loading from "@/animations/Loading.json";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResumeData {
  resume?: {
    personalInfo?: any;
    summary?: string;
    professionalSummary?: string;
    professionalExperience?: Array<{
      companyName?: string;
      companyIntroduction?: string;
      location?: string;
      jobTitle?: string;
      startDate?: string;
      endDate?: string;
      achievements?: string[];
    }>;
    education?: any;
    skills?: any;
    projects?: any[];
    volunteer?: any[];
    certifications?: any[];
    guidanceForOptimization?: Array<{
      guidance: string[];
    }>;
  };
  sectionOrder?: ResumeSection[];
}

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
  onSectionChange: parentSectionChangeHandler,
}: ResumeEditorProps) => {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedData, setSavedData] = useState<any>(null);
  const [hasUnsavedChanges, setLocalHasUnsavedChanges] =
    useState<boolean>(false);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"visual" | "json">("visual");
  const [sectionOrder, setSectionOrder] = useState<ResumeSection[]>(
    getAllSections()
  );
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeSectionRef = useRef<ResumeSection | null>(null);
  const loadingOptions = {
    loop: true,
    autoplay: true,
    animationData: Loading,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  const isMobile = useIsMobile();
  const contentHeight = useRef<number>(0);
  
  useEffect(() => {
    // Calculate the available height for content
    const calculateHeight = () => {
      const viewportHeight = window.innerHeight;
      // Approximate height of header (title) + footer (action buttons)
      const headerFooterHeight = 120; 
      contentHeight.current = viewportHeight - headerFooterHeight;
      
      const mainContentContainer = document.getElementById('main-content-container');
      if (mainContentContainer) {
        mainContentContainer.style.height = `${contentHeight.current}px`;
      }
    };
    
    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, []);

  useEffect(() => {
    const initialSections = getAllSections();
    const otherSections = initialSections.filter(
      (section) => section !== "personalInfo"
    );
    const orderedSections: ResumeSection[] = [
      "personalInfo" as ResumeSection,
      ...otherSections,
    ];

    setSectionOrder(orderedSections);

    const initialCollapsedState: Record<string, boolean> = {};
    orderedSections.forEach((section, index) => {
      initialCollapsedState[section] = index !== 0;
    });
    setCollapsedSections(initialCollapsedState);

    activeSectionRef.current = orderedSections[0];
  }, []);

  useEffect(() => {
    const fetchResumeAndJobData = async () => {
      setIsLoading(true);
      try {
        const { data: analysisData, error: analysisError } = await supabase
          .from("resume_analyses")
          .select("job_id")
          .eq("id", analysisId)
          .single();

        if (analysisError) throw analysisError;

        if (analysisData.job_id) {
          const { data: jobData, error: jobError } = await supabase
            .from("jobs")
            .select("job_description")
            .eq("id", analysisData.job_id)
            .single();

          if (jobError) throw jobError;
          setJobData(jobData.job_description);
        }

        const { data: editorData, error: editorError } = await supabase
          .from("resume_editors")
          .select("id, content")
          .eq("analysis_id", analysisId)
          .maybeSingle();

        if (editorError && editorError.code !== "PGRST116") {
          throw editorError;
        }

        if (editorData && editorData.content) {
          console.log("Found editor content:", editorData.content);

          let processedContent: ResumeData;
          if (editorData.content.resume) {
            if (editorData.content.resume.resume) {
              processedContent = {
                resume: editorData.content.resume.resume,
              };
              console.log(
                "Found doubly nested resume structure, normalizing..."
              );
            } else {
              processedContent = editorData.content as ResumeData;
              console.log("Using standard resume structure");
            }

            if (
              processedContent.resume &&
              processedContent.resume.professionalExperience
            ) {
              processedContent.resume.professionalExperience =
                processedContent.resume.professionalExperience.map(
                  (exp: any) => ({
                    ...exp,
                    companyIntroduction: exp.companyIntroduction || "",
                  })
                );
            }
          } else if (
            Object.keys(editorData.content).includes("personalInfo") ||
            Object.keys(editorData.content).includes("professionalExperience")
          ) {
            processedContent = { resume: editorData.content as any };
            console.log("Found direct data structure, adding resume wrapper");
          } else {
            processedContent = editorData.content as ResumeData;
            console.log("Using editor content as is (unrecognized format)");
          }

          if (
            processedContent.sectionOrder &&
            Array.isArray(processedContent.sectionOrder)
          ) {
            setSectionOrder(processedContent.sectionOrder);

            const initialCollapsedState: Record<string, boolean> = {};
            processedContent.sectionOrder.forEach(
              (section: string, index: number) => {
                initialCollapsedState[section] = index !== 0;
              }
            );
            setCollapsedSections(initialCollapsedState);
          }

          setResumeData(processedContent);
          setSavedData(JSON.stringify(processedContent));
          setEditorId(editorData.id);
          console.log("Set resume data:", processedContent);
        } else {
          let initialContent: ResumeData = { resume: {} };

          if (goldenResume) {
            try {
              let parsedContent =
                typeof goldenResume === "string"
                  ? JSON.parse(goldenResume)
                  : goldenResume;

              if (parsedContent.resume) {
                if (parsedContent.resume.resume) {
                  initialContent = {
                    resume: parsedContent.resume.resume,
                  };
                  console.log("Parsed golden resume with double nesting");
                } else {
                  initialContent = parsedContent;
                  console.log("Parsed golden resume with single nesting");
                }
              } else if (
                Object.keys(parsedContent).includes("personalInfo") ||
                Object.keys(parsedContent).includes("professionalExperience")
              ) {
                initialContent = { resume: parsedContent };
                console.log("Parsed golden resume with direct data structure");
              } else {
                initialContent = parsedContent;
                console.log("Using parsed golden resume as is");
              }

              if (
                initialContent.resume &&
                initialContent.resume.professionalExperience
              ) {
                initialContent.resume.professionalExperience =
                  initialContent.resume.professionalExperience.map(
                    (exp: any) => ({
                      ...exp,
                      companyIntroduction: exp.companyIntroduction || "",
                    })
                  );
              }
            } catch (e) {
              console.error("Failed to parse golden resume:", e);
              initialContent = { resume: {} };
            }
          }

          const { data: newEditor, error: createError } = await supabase
            .from("resume_editors")
            .insert({
              analysis_id: analysisId,
              content: initialContent,
            })
            .select("id")
            .single();

          if (createError) throw createError;

          setResumeData(initialContent);
          setSavedData(JSON.stringify(initialContent));
          setEditorId(newEditor.id);
          console.log("Created new resume data:", initialContent);
        }
      } catch (error: any) {
        console.error("Error fetching or creating editor content:", error);
        toast({
          title: "Error",
          description: "Failed to load or initialize resume content.",
          variant: "destructive",
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
    const contentChanged =
      JSON.stringify(resumeData) !== savedData && savedData !== null;
    setLocalHasUnsavedChanges(contentChanged);
    setHasUnsavedChanges(contentChanged);
  }, [resumeData, savedData, setHasUnsavedChanges]);

  const handleSectionToggle = useCallback((section: ResumeSection) => {
    console.log("Toggle section:", section);

    setCollapsedSections((prev) => {
      const wasPreviouslyCollapsed = prev[section];

      if (wasPreviouslyCollapsed) {
        const newState: Record<string, boolean> = {};
        Object.keys(prev).forEach((key) => {
          newState[key as ResumeSection] = key !== section;
        });
        activeSectionRef.current = section;
        return newState;
      } else {
        return { ...prev, [section]: true };
      }
    });
  }, []);

  const handleSectionsReorder = useCallback((sections: ResumeSection[]) => {
    console.log("Reordering sections:", sections);
    setSectionOrder(sections);

    setResumeData((prevData: any) => {
      if (!prevData) return null;
      return {
        ...prevData,
        sectionOrder: sections,
      };
    });

    scheduleAutoSave();
  }, []);

  const handleResumeDataChange = useCallback((updatedData: any) => {
    setResumeData(updatedData);
    scheduleAutoSave();
  }, []);

  const validateResumeData = (data: any): boolean => {
    try {
      if (typeof data !== "object" || data === null) {
        return false;
      }

      if (!data.resume || typeof data.resume !== "object") {
        console.error("Invalid resume data format: missing resume object");
        return false;
      }

      return true;
    } catch (e) {
      console.error("Resume validation error:", e);
      return false;
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

    console.log("About to save resume data:", resumeData);

    if (!validateResumeData(resumeData)) {
      toast({
        title: "Invalid resume format",
        description:
          "Please ensure your resume is properly formatted before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!isAutoSave) setIsSaving(true);
    try {
      const dataToSave = {
        ...resumeData,
        sectionOrder: sectionOrder,
      };

      if (dataToSave.resume?.professionalExperience) {
        dataToSave.resume.professionalExperience =
          dataToSave.resume.professionalExperience.map((exp: any) => ({
            ...exp,
            companyIntroduction: exp.companyIntroduction || "",
          }));
      }

      console.log(`${isAutoSave ? "Auto-saving" : "Saving"} data:`, dataToSave);

      const { error } = await supabase
        .from("resume_editors")
        .update({
          content: dataToSave,
          last_saved: new Date().toISOString(),
        })
        .eq("id", editorId);

      if (error) {
        throw error;
      }

      if (!isAutoSave) {
        toast({
          title: "Success",
          description: "Resume saved successfully!",
          duration: 3000,
        });
      } else {
        console.log("Auto-saved resume successfully");
      }

      setSavedData(JSON.stringify(dataToSave));
      setLocalHasUnsavedChanges(false);
      setHasUnsavedChanges(false);
    } catch (error: any) {
      console.error("Save error:", error);
      if (!isAutoSave) {
        toast({
          title: "Error",
          description:
            error.message || "Failed to save resume. Please try again.",
          variant: "destructive",
        });
      } else {
        console.error("Auto-save failed:", error);
      }
    } finally {
      if (!isAutoSave) setIsSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const handlePreview = () => {
    navigate(`/resume-preview/${analysisId}`, {
      state: {
        resumeId,
        goldenResume: JSON.stringify(resumeData),
        analysisId,
      },
    });
  };

  const handleRawJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const parsed = JSON.parse(e.target.value);
      setResumeData(parsed);
      scheduleAutoSave();
    } catch (error) {
      console.error("Invalid JSON:", error);
    }
  };
  
  const resumeEditorRef = useRef<HTMLDivElement>(null);
  const jobDescriptionRef = useRef<HTMLDivElement>(null);
  const resumeSectionsRef = useRef<HTMLDivElement>(null);
  const oozeOptimizationRef = useRef<HTMLDivElement>(null);
    
  useEffect(() => {
    // Force immediate calculation of heights on mount
    const calculateHeights = () => {
      const headerHeight = 80; // Height for the page header including title and any padding
      const viewportHeight = window.innerHeight;
      const editorHeight = viewportHeight - headerHeight;
      
      if (resumeEditorRef.current) {
        resumeEditorRef.current.style.height = `${editorHeight}px`;
      }
      
      if (jobDescriptionRef.current) {
        jobDescriptionRef.current.style.height = `${editorHeight}px`;
      }
      
      if (resumeSectionsRef.current) {
        resumeSectionsRef.current.style.height = `${editorHeight}px`;
      }
      
      if (oozeOptimizationRef.current) {
        oozeOptimizationRef.current.style.height = `${editorHeight}px`;
      }
    };

    // Calculate heights immediately
    calculateHeights();
    
    // Also set up resize handler
    window.addEventListener('resize', calculateHeights);
    
    return () => {
      window.removeEventListener('resize', calculateHeights);
    };
  }, []);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = sectionOrder.filter((section) => section !== "personalInfo");
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    handleSectionsReorder(["personalInfo" as ResumeSection, ...items]);
  };

  if (isLoading) {
    return (
      <div className="w-64 h-64 mx-auto">
        <Lottie options={loadingOptions} />
      </div>
    );
  }

  return (
    <div 
      ref={resumeEditorRef} 
      className="flex flex-col h-full lg:flex-row overflow-hidden"
    >
      {/* Top action buttons - Added JSON Editor, Preview, and Save buttons */}
      <div className="flex items-center justify-between p-2 border-b bg-white">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setViewMode(viewMode === 'visual' ? 'json' : 'visual')}
            className="flex items-center gap-1"
          >
            <FileJson className="h-4 w-4" />
            {viewMode === 'visual' ? 'JSON Editor' : 'Visual Editor'}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePreview}
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button
            onClick={() => handleSaveContent(false)}
            disabled={isSaving || !hasUnsavedChanges}
            variant="default"
            size="sm"
            className="flex items-center gap-1"
          >
            {isSaving ? (
              <span className="flex items-center gap-1">
                <Lottie 
                  options={{
                    loop: true,
                    autoplay: true,
                    animationData: Loading,
                    rendererSettings: {
                      preserveAspectRatio: "xMidYMid slice",
                    }
                  }}
                  height={16}
                  width={16}
                />
                Saving...
              </span>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main content area - conditional rendering based on viewMode */}
      {viewMode === 'json' ? (
        <div className="flex-1 p-4 overflow-auto">
          <Textarea
            className="h-full font-mono text-sm"
            value={JSON.stringify(resumeData, null, 2)}
            onChange={handleRawJsonChange}
          />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Job Description Section */}
          <div
            ref={jobDescriptionRef}
            className="lg:w-1/4 border-r lg:border-r-1 overflow-hidden bg-white"
          >
            <ScrollArea className="h-full">
              <div className="p-4">
                <JobDescriptionViewer jobData={jobData} />
              </div>
            </ScrollArea>
          </div>

          {/* Resume Sections */}
          <div
            ref={resumeSectionsRef}
            className="lg:w-2/4 overflow-hidden bg-white"
          >
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="mb-4 flex items-center lg:hidden">
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

                <SectionEditor
                  key="personalInfo"
                  section="personalInfo"
                  resumeData={resumeData}
                  onChange={handleResumeDataChange}
                  isCollapsed={collapsedSections["personalInfo"]}
                  onToggleCollapse={handleSectionToggle}
                  isDraggable={false}
                  onAutoSave={scheduleAutoSave}
                />

                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="droppable-sections">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-4"
                      >
                        {sectionOrder
                          .filter((section) => section !== "personalInfo")
                          .map((section, index) => (
                            <Draggable
                              key={section}
                              draggableId={section}
                              index={index}
                              isDragDisabled={false}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                  }}
                                >
                                  <SectionEditor
                                    key={section}
                                    section={section}
                                    resumeData={resumeData}
                                    onChange={handleResumeDataChange}
                                    isCollapsed={collapsedSections[section]}
                                    onToggleCollapse={handleSectionToggle}
                                    isDraggable={true}
                                    onAutoSave={scheduleAutoSave}
                                  />
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
          </div>

          {/* Ooze Optimization Section */}
          <div
            ref={oozeOptimizationRef}
            className="lg:w-1/4 border-l lg:border-l-1 overflow-hidden bg-white"
          >
            <ScrollArea className="h-full">
              <div className="p-4">
                <OozeOptimizationSection
                  optimizationData={resumeData}
                  analysisId={analysisId}
                />
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Mobile Ooze Optimization Button (unchanged) */}
      <div className="fixed bottom-4 right-4 z-50 lg:hidden">
        <button
          className="bg-primary text-primary-foreground rounded-full p-2 shadow-md"
          onClick={() => {
            console.log("Ooze Optimization展开");
          }}
        >
          ✨
        </button>
      </div>
    </div>
  );
};

export default ResumeEditor;
