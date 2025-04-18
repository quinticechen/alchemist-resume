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
import { ChevronDown, ChevronUp, GripVertical, Lock } from "lucide-react";
import { ResumeData } from '@/types/resume';

interface SectionEditorProps {
  section: ResumeSection;
  resumeData: ResumeData;
  onChange: (updatedData: ResumeData) => void;
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
  const data = resumeData?.resume || resumeData;
  
  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse(section);
    }
  };

  const renderSectionContent = () => {
    if (isCollapsed) {
      return null;
    }

    switch (section) {
      case 'personalInfo':
        return <PersonalInfoSection data={data} onChange={onChange} />;
      case 'professionalSummary':
        return <ProfessionalSummarySection data={data} onChange={onChange} />;
      case 'professionalExperience':
        return <ExperienceSection data={data} onChange={onChange} showAddForm={true} />;
      case 'education':
        return <EducationSection data={data} onChange={onChange} showAddForm={true} />;
      case 'skills':
        return <SkillsSection data={data} onChange={onChange} showAddForm={true} />;
      case 'projects':
        return <ProjectsSection data={data} onChange={onChange} showAddForm={true} />;
      case 'volunteer':
        return <VolunteerSection data={data} onChange={onChange} showAddForm={true} />;
      case 'certifications':
        return <CertificationsSection data={data} onChange={onChange} showAddForm={true} />;
      default:
        return <div>Section editor not available</div>;
    }
  };

  const isPersonalInfo = section === 'personalInfo';

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isDraggable ? (
            <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
          ) : isPersonalInfo ? (
            <Lock className="h-4 w-4 text-gray-400" />
          ) : null}
          <h3 className="font-semibold text-lg">{getSectionDisplayName(section)}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleCollapse}
          className="p-0 h-8 w-8 hover:bg-gray-100"
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      </div>
      {renderSectionContent()}
    </div>
  );
};

export default SectionEditor;
