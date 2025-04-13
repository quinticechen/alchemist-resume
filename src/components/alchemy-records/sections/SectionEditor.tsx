
import React from 'react';
import { ResumeSection } from '@/utils/resumeUtils';
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
import { ChevronDown, ChevronUp } from "lucide-react";

interface SectionEditorProps {
  section: ResumeSection;
  resumeData: any;
  onChange: (updatedData: any) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (section: ResumeSection, collapsed: boolean) => void;
}

const SectionEditor = ({ section, resumeData, onChange, isCollapsed = false, onToggleCollapse }: SectionEditorProps) => {
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
      onToggleCollapse(section, !isCollapsed);
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

  const getSectionTitle = () => {
    switch (section) {
      case 'personalInfo': return 'Personal Information';
      case 'professionalSummary': return 'Professional Summary';
      case 'professionalExperience': return 'Professional Experience';
      case 'education': return 'Education';
      case 'skills': return 'Skills';
      case 'projects': return 'Projects';
      case 'volunteer': return 'Volunteer Experience';
      case 'certifications': return 'Certifications';
      default: return 'Section';
    }
  };

  return (
    <Collapsible open={!isCollapsed} onOpenChange={(open) => onToggleCollapse && onToggleCollapse(section, !open)} className="mb-6 border rounded-md">
      <div className="bg-gray-50 p-4 flex justify-between items-center border-b">
        <h3 className="text-lg font-medium">{getSectionTitle()}</h3>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" onClick={handleToggleCollapse}>
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent>
        <div className="p-4">
          {renderSectionContent()}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default SectionEditor;
