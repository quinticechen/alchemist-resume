import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Save, AlertTriangle, Eye, FileJson } from "lucide-react";
import SectionSelector from "./SectionSelector";
import SectionEditor from "./sections/SectionEditor";
import JobDescriptionViewer from "./JobDescriptionViewer";
import SeekerOptimizationSection from "./SeekerOptimizationSection";
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

  useEffect(() => {
    if (sectionOrder.length > 0) {
      const newSectionOrder = [...sectionOrder];

      const personalInfoIndex = newSectionOrder.indexOf("personalInfo");
      const expIndex = newSectionOrder.indexOf("professionalExperience");

      if (personalInfoIndex > -1) {
        newSectionOrder.splice(personalInfoIndex, 1);
      }

      if (expIndex > -1) {
        newSectionOrder.splice(
          expIndex > personalInfoIndex && personalInfoIndex > -1
            ? expIndex - 1
            : expIndex,
          1
        );
      }

      if (expIndex > -1) {
        newSectionOrder.unshift("professionalExperience");
      }

      newSectionOrder.unshift("personalInfo");

      setSectionOrder(newSectionOrder);

      // Initially set all sections to collapsed except the first one
      const initialCollapsedState: Record<string, boolean> = {};
      newSectionOrder.forEach((section, index) => {
        initialCollapsedState[section] = index !== 0;
      });
      setCollapsedSections(initialCollapsedState);

      // Set the initial active section
      activeSectionRef.current = newSectionOrder[0];
    }
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
          // Normalize the data structure - handle different formats
          if (editorData.content.resume) {
            if (editorData.content.resume.resume) {
              // Handle double nested resume structure
              processedContent = {
                resume: editorData.content.resume.resume,
              };
              console.log(
                "Found doubly nested resume structure, normalizing..."
              );
            } else {
              // Standard resume.* structure
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
            // Direct data structure without resume wrapper
            processedContent = { resume: editorData.content as any };
            console.log("Found direct data structure, adding resume wrapper");
          } else {
            // Unknown structure, try to use as is
            processedContent = editorData.content as ResumeData;
            console.log("Using editor content as is (unrecognized format)");
          }

          if (
            processedContent.sectionOrder &&
            Array.isArray(processedContent.sectionOrder)
          ) {
            setSectionOrder(processedContent.sectionOrder);

            // Only expand the first section initially
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

              // Handle different data structures
              if (parsedContent.resume) {
                if (parsedContent.resume.resume) {
                  // Double nested case: { resume: { resume: {...} } }
                  initialContent = {
                    resume: parsedContent.resume.resume,
                  };
                  console.log("Parsed golden resume with double nesting");
                } else {
                  // Regular case: { resume: {...} }
                  initialContent = parsedContent;
                  console.log("Parsed golden resume with single nesting");
                }
              } else if (
                Object.keys(parsedContent).includes("personalInfo") ||
                Object.keys(parsedContent).includes("professionalExperience")
              ) {
                // Direct data: { personalInfo: {...}, ... }
                initialContent = { resume: parsedContent };
                console.log("Parsed golden resume with direct data structure");
              } else {
                // Use as is
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

  // Function to handle section toggling and ensure only one section is expanded at a time
  const handleSectionToggle = useCallback((section: ResumeSection) => {
    console.log("Toggle section:", section);

    // If section is collapsed and being expanded, collapse all other sections
    setCollapsedSections((prev) => {
      const wasPreviouslyCollapsed = prev[section];

      if (wasPreviouslyCollapsed) {
        // This section is being expanded, so collapse all others
        const newState: Record<string, boolean> = {};
        Object.keys(prev).forEach((key) => {
          newState[key as ResumeSection] = key !== section;
        });
        activeSectionRef.current = section;
        return newState;
      } else {
        // This section is being collapsed
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

    // Trigger auto-save after reordering
    scheduleAutoSave();
  }, []);

  const handleResumeDataChange = useCallback((updatedData: any) => {
    setResumeData(updatedData);
    // Data has changed, schedule auto-save
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

  // Schedule auto-save after changes, debounced to avoid too many requests
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleSaveContent(true);
    }, 2000); // Wait 2 seconds of inactivity before saving
  }, []);

  // Save content to Supabase
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

  // Cleanup auto-save timer on unmount
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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = sectionOrder.filter(section => section !== 'personalInfo'); // Exclude personalInfo from the draggable items
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Ensure personalInfo is always at the beginning when updating the state
    handleSectionsReorder(['personalInfo', ...items]);
  };

    handleSectionsReorder(items);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading editor...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as "visual" | "json")}
          className="h-full"
        >
          <TabsContent value="visual" className="mt-0 h-full">
            <ResizablePanelGroup
              direction="horizontal"
              className="h-[calc(100vh-200px)]"
            >
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
                            {/* Render Personal Info separately and non-draggable */}
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

                            {/* Render other sections as draggable */}
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
              onClick={() =>
                setViewMode(viewMode === "visual" ? "json" : "visual")
              }
            >
              <FileJson className="h-4 w-4 mr-2" />
              {viewMode === "visual" ? "JSON Editor" : "Visual Editor"}
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
                onClick={() => handleSaveContent(false)}
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
