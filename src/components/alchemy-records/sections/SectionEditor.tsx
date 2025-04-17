
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

  const renderSectionContent = () => {
    switch (section) {
      case 'personalInfo':
        return <PersonalInfoSection data={data} onChange={handleDataChange} />;
      case 'professionalSummary':
        return <ProfessionalSummarySection data={data} onChange={handleDataChange} />;
      case 'professionalExperience':
        return <ExperienceSection data={data} onChange={handleDataChange} showAddForm={true} />;
      case 'education':
        return <EducationSection data={data} onChange={handleDataChange} showAddForm={true} />;
      case 'skills':
        return <SkillsSection data={data} onChange={handleDataChange} showAddForm={true} />;
      case 'projects':
        return <ProjectsSection data={data} onChange={handleDataChange} showAddForm={true} />;
      case 'volunteer':
        return <VolunteerSection data={data} onChange={handleDataChange} showAddForm={true} />;
      case 'certifications':
        return <CertificationsSection data={data} onChange={handleDataChange} showAddForm={true} />;
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
