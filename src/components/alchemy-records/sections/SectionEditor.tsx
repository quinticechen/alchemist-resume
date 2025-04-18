
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
import { Lock } from "lucide-react";
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
        return <ExperienceSection data={data} onChange={onChange} showAddForm={false} />;
      case 'education':
        return <EducationSection data={data} onChange={onChange} showAddForm={false} />;
      case 'skills':
        return <SkillsSection data={data} onChange={onChange} showAddForm={false} />;
      case 'projects':
        return <ProjectsSection data={data} onChange={onChange} showAddForm={false} />;
      case 'volunteer':
        return <VolunteerSection data={data} onChange={onChange} showAddForm={false} />;
      case 'certifications':
        return <CertificationsSection data={data} onChange={onChange} showAddForm={false} />;
      default:
        return <div>Section editor not available</div>;
    }
  };

  return (
    <div>
      {renderSectionContent()}
    </div>
  );
};

export default SectionEditor;
