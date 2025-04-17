
import React from 'react';
import { ResumeSection, getSectionDisplayName } from '@/utils/resumeUtils';
import PersonalInfoSection from './PersonalInfoSection';
import ProfessionalSummarySection from './ProfessionalSummarySection';
import ExperienceSection from './ExperienceSection';
import EducationSection from './EducationSection';
import SkillsSection from './SkillsSection';
import ProjectsSection from './ProjectsSection';
import VolunteerSection from './VolunteerSection';
import CertificationsSection from './CertificationsSection';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";

interface SectionEditorProps {
  section: ResumeSection;
  resumeData: any;
  onChange: (updatedData: any) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (section: ResumeSection) => void;
  isDraggable?: boolean;
}

const SectionEditor = ({ 
  section, 
  resumeData, 
  onChange, 
  isCollapsed = false, 
  onToggleCollapse,
  isDraggable = false
}: SectionEditorProps) => {
  // Extract resume from the data structure if it exists, otherwise use the data as is
  const data = resumeData?.resume || resumeData || {};

  const handleDataChange = (updatedSectionData: any) => {
    // Check if we're working with a nested resume structure
    if (resumeData?.resume) {
      onChange({
        ...resumeData,
        resume: {
          ...resumeData.resume,
          ...updatedSectionData
        }
      });
    } else {
      // Direct data structure
      onChange({
        ...resumeData,
        ...updatedSectionData
      });
    }
  };

  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse(section);
    }
  };

  // Always include showAddForm prop for all section components that need it
  const sectionProps = {
    data,
    onChange: handleDataChange,
    showAddForm: true
  };

  const renderSectionContent = () => {
    switch (section) {
      case 'personalInfo':
        return <PersonalInfoSection data={data} onChange={handleDataChange} />;
      case 'professionalSummary':
        return <ProfessionalSummarySection data={data} onChange={handleDataChange} />;
      case 'professionalExperience':
        return <ExperienceSection {...sectionProps} />;
      case 'education':
        return <EducationSection {...sectionProps} />;
      case 'skills':
        return <SkillsSection {...sectionProps} />;
      case 'projects':
        return <ProjectsSection {...sectionProps} />;
      case 'volunteer':
        return <VolunteerSection {...sectionProps} />;
      case 'certifications':
        return <CertificationsSection {...sectionProps} />;
      default:
        return <div>Section editor not available</div>;
    }
  };

  return (
    <div className="mb-6 border rounded-md shadow-sm">
      <div className="bg-gray-50 p-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-2">
          {isDraggable && <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />}
          <h3 className="text-lg font-medium">{getSectionDisplayName(section)}</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleToggleCollapse} 
          className="p-1 h-8 w-8"
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>
      
      {!isCollapsed && (
        <div className="p-4">
          {renderSectionContent()}
        </div>
      )}
    </div>
  );
};

export default SectionEditor;
