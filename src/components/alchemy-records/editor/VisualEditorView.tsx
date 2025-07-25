
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import SectionEditor from '../sections/SectionEditor';
import SectionSelector from '../SectionSelector';
import JobDescriptionViewer from '../JobDescriptionViewer';
import OozeOptimizationSection from '../chat/OozeOptimizationSection';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { ResumeSection } from '@/utils/resumeUtils';
import OozeAnimation from "@/components/OozeAnimation";

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
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = sectionOrder.filter((section) => section !== "personalInfo");
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onSectionsReorder(["personalInfo" as ResumeSection, ...items]);
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Job Description Section */}
      <div className="w-1/4 overflow-hidden bg-white border-r">
        <ScrollArea className="h-full">
          <div className="p-4">
            <JobDescriptionViewer jobData={jobData} />
          </div>
        </ScrollArea>
      </div>

      {/* Resume Sections */}
      <div className="w-2/4 overflow-hidden bg-white">
        <ScrollArea className="h-full">
          <div className="p-4">
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
      <div className="w-1/4 overflow-hidden bg-white border-l flex flex-col">
        <div className="sticky top-0 z-10 bg-white flex justify-center py-2 border-b">
          <OozeAnimation width={100} height={100} />
        </div>
        <div className="flex-grow overflow-hidden">
          <OozeOptimizationSection
            optimizationData={resumeData}
            analysisId={analysisId}
          />
        </div>
      </div>
    </div>
  );
};

export default VisualEditorView;
