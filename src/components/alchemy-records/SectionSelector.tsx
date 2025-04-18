
import React from 'react';
import { ResumeSection, getSectionDisplayName } from '@/utils/resumeUtils';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical, ChevronDown, ChevronUp, Lock } from "lucide-react";

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
    // If there's no destination or it hasn't moved, do nothing
    if (!result.destination || result.destination.index === result.source.index) {
      return;
    }
    
    // Create a completely new array to avoid mutation issues
    const newSectionOrder = [...sections];
    
    // Get the section being moved
    const draggedSection = newSectionOrder[result.source.index];
    
    // Don't allow moving personalInfo section
    if (draggedSection === 'personalInfo') {
      return;
    }
    
    // Remove the section from its original position
    newSectionOrder.splice(result.source.index, 1);
    
    // Add it to the new position
    newSectionOrder.splice(result.destination.index, 0, draggedSection);
    
    // Ensure personalInfo is always at the top if it exists in the array
    const personalInfoIndex = newSectionOrder.findIndex(section => section === 'personalInfo');
    if (personalInfoIndex > 0) {
      // Remove personalInfo from its current position
      newSectionOrder.splice(personalInfoIndex, 1);
      // Add it back at the beginning
      newSectionOrder.unshift('personalInfo');
    }
    
    // Update the parent component with the new order
    onSectionsReorder(newSectionOrder);
  };
  
  return (
    <div className="w-full h-full overflow-auto">
      <h3 className="font-medium text-lg mb-3">Resume Sections</h3>
      <p className="text-sm text-muted-foreground mb-4">Drag to reorder sections</p>
      
      {/* Personal Info section - always at the top and not draggable */}
      {sections.includes('personalInfo') && (
        <div className="flex items-center bg-white hover:bg-gray-50 rounded-md border p-2 mb-1">
          <div className="p-1">
            <Lock className="h-4 w-4 text-gray-400" />
          </div>
          
          <span className="flex-1 ml-2">{getSectionDisplayName('personalInfo')}</span>
          
          <button
            onClick={() => onSectionToggle('personalInfo')}
            type="button"
            className="p-1 hover:bg-gray-200 rounded-full"
            aria-label={collapsedSections['personalInfo'] ? "Expand section" : "Collapse section"}
          >
            {collapsedSections['personalInfo'] ? 
              <ChevronDown className="h-4 w-4" /> : 
              <ChevronUp className="h-4 w-4" />
            }
          </button>
        </div>
      )}
      
      {/* Draggable sections (excluding Personal Info) */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="droppable-sections">
          {(provided) => (
            <div 
              className="flex flex-col space-y-1"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {sections
                .filter(section => section !== 'personalInfo')
                .map((section, index) => (
                <Draggable key={section} draggableId={section} index={index} isDragDisabled={false}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={provided.draggableProps.style}
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
                        type="button"
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
