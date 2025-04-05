
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

interface SectionEditorProps {
  section: ResumeSection;
  resumeData: any;
  onChange: (updatedData: any) => void;
}

const SectionEditor = ({ section, resumeData, onChange }: SectionEditorProps) => {
  console.log('SectionEditor resumeData:', resumeData);
  
  // Extract resume from the data structure if it exists, otherwise use the data as is
  const data = resumeData?.resume || resumeData || {};
  console.log('SectionEditor extracted data:', data);

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

  // Always include showAddForm prop for all section components that need it
  const sectionProps = {
    data,
    onChange: handleDataChange,
    showAddForm: true
  };

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

export default SectionEditor;
