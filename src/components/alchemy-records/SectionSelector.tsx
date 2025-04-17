
import React from 'react';
import { ResumeSection, getSectionDisplayName } from '@/utils/resumeUtils';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical, ChevronDown, ChevronUp } from "lucide-react";

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
                      className="flex items-center bg-white hover:bg-gray-50 rounded-md border p-2"
                    >
                      <div 
                        {...provided.dragHandleProps}
                        className="p-1 cursor-grab"
                      >
                        <GripVertical className="h-4 w-4 text-gray-400" />
                      </div>
                      
                      <span className="flex-1 ml-2">{getSectionDisplayName(section)}</span>
                      
                      <button
                        onClick={() => onSectionToggle(section)}
                        className="p-1 hover:bg-gray-200 rounded-full"
                        aria-label={collapsedSections[section] ? "Expand section" : "Collapse section"}
                      >
                        {collapsedSections[section] ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronUp className="h-4 w-4" />
                        }
                      </button>
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
