
import React, { useState, useEffect } from 'react';
import { ResumeSection, getSectionDisplayName, getAllSections } from '@/utils/resumeUtils';
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical } from "lucide-react";

interface SectionSelectorProps {
  sections: ResumeSection[];
  onSectionToggle: (section: ResumeSection) => void;
  onSectionsReorder: (sections: ResumeSection[]) => void;
  collapsedSections: Record<string, boolean>;
}

const SectionSelector = ({ 
  sections,
  onSectionToggle,
  onSectionsReorder,
  collapsedSections
}: SectionSelectorProps) => {
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
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
                        variant="ghost"
                        className="justify-start text-left flex-1"
                        onClick={() => onSectionToggle(section)}
                      >
                        <span className="flex items-center gap-2">
                          {collapsedSections[section] ? '▶' : '▼'} {getSectionDisplayName(section)}
                        </span>
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
