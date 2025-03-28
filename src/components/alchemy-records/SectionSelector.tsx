
import React from 'react';
import { ResumeSection, getSectionDisplayName, getAllSections } from '@/utils/resumeUtils';
import { Button } from "@/components/ui/button";

interface SectionSelectorProps {
  currentSection: ResumeSection;
  onSectionChange: (section: ResumeSection) => void;
}

const SectionSelector = ({ currentSection, onSectionChange }: SectionSelectorProps) => {
  const sections = getAllSections();
  
  return (
    <div className="w-full h-full overflow-auto">
      <h3 className="font-medium text-base mb-3">Resume Sections</h3>
      <div className="flex flex-col space-y-1">
        {sections.map((section) => (
          <Button
            key={section}
            variant={currentSection === section ? "default" : "ghost"}
            className={`justify-start text-left ${currentSection === section ? "bg-blue-100 text-blue-800" : ""}`}
            onClick={() => onSectionChange(section)}
          >
            {getSectionDisplayName(section)}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SectionSelector;
