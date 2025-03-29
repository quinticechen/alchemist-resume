
import React, { useState, useEffect } from 'react';
import { ResumeSection, getSectionDisplayName, getAllSections } from '@/utils/resumeUtils';
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical } from "lucide-react";

interface SectionSelectorProps {
  currentSection: ResumeSection;
  onSectionChange: (section: ResumeSection) => void;
  onSectionsReorder: (sections: ResumeSection[]) => void;
  initialSections?: ResumeSection[];
}

const SectionSelector = ({ 
  currentSection, 
  onSectionChange, 
  onSectionsReorder,
  initialSections 
}: SectionSelectorProps) => {
  const [sections, setSections] = useState<ResumeSection[]>(
    initialSections || getAllSections()
  );
  
  useEffect(() => {
    if (initialSections) {
      setSections(initialSections);
    }
  }, [initialSections]);
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setSections(items);
    onSectionsReorder(items);
  };
  
  return (
    <div className="w-full h-full overflow-auto">
      <h3 className="font-medium text-lg mb-3">Resume Sections</h3>
      <p className="text-sm text-muted-foreground mb-4">Drag to reorder sections</p>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="droppable-sections">
          {(provided) => (
            <div 
              className="flex flex-col space-y-1"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {sections.map((section, index) => (
                <Draggable key={section} draggableId={section} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="flex items-center"
                    >
                      <div 
                        {...provided.dragHandleProps}
                        className="p-2 cursor-grab"
                      >
                        <GripVertical className="h-4 w-4 text-gray-400" />
                      </div>
                      
                      <Button
                        variant={currentSection === section ? "default" : "ghost"}
                        className={`justify-start text-left flex-1 ${currentSection === section ? "bg-blue-100 text-blue-800" : ""}`}
                        onClick={() => onSectionChange(section)}
                      >
                        {getSectionDisplayName(section)}
                      </Button>
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
  );
};

export default SectionSelector;
