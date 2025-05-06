
import React, { useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import SectionEditor from '../sections/SectionEditor';
import SectionSelector from '../SectionSelector';
import JobDescriptionViewer from '../JobDescriptionViewer';
import OozeOptimizationSection from '../OozeOptimizationSection';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { ResumeSection } from '@/utils/resumeUtils';

interface VisualEditorViewProps {
  resumeData: any;
  jobData: any;
  analysisId: string;
  sectionOrder: ResumeSection[];
  collapsedSections: Record<string, boolean>;
  onSectionToggle: (section: ResumeSection) => void;
  onSectionsReorder: (sections: ResumeSection[]) => void;
  onResumeDataChange: (data: any) => void;
  onAutoSave: () => void;
}

const VisualEditorView: React.FC<VisualEditorViewProps> = ({
  resumeData,
  jobData,
  analysisId,
  sectionOrder,
  collapsedSections,
  onSectionToggle,
  onSectionsReorder,
  onResumeDataChange,
  onAutoSave,
}) => {
  const jobDescriptionRef = useRef<HTMLDivElement>(null);
  const resumeSectionsRef = useRef<HTMLDivElement>(null);
  const oozeOptimizationRef = useRef<HTMLDivElement>(null);
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = sectionOrder.filter((section) => section !== "personalInfo");
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onSectionsReorder(["personalInfo" as ResumeSection, ...items]);
  };

  return (
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
                onSectionToggle={onSectionToggle}
                onSectionsReorder={onSectionsReorder}
                collapsedSections={collapsedSections}
              />
            </div>

            <SectionEditor
              key="personalInfo"
              section="personalInfo"
              resumeData={resumeData}
              onChange={onResumeDataChange}
              isCollapsed={collapsedSections["personalInfo"]}
              onToggleCollapse={onSectionToggle}
              isDraggable={false}
              onAutoSave={onAutoSave}
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
                                onChange={onResumeDataChange}
                                isCollapsed={collapsedSections[section]}
                                onToggleCollapse={onSectionToggle}
                                isDraggable={true}
                                onAutoSave={onAutoSave}
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
  );
};

export default VisualEditorView;
