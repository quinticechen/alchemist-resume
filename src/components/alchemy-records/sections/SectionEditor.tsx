
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

  switch (section) {
    case 'personalInfo':
      return <PersonalInfoSection data={data} onChange={handleDataChange} />;
    case 'professionalSummary':
      return <ProfessionalSummarySection data={data} onChange={handleDataChange} />;
    case 'professionalExperience':
      return <ExperienceSection data={data} onChange={handleDataChange} />;
    case 'education':
      return <EducationSection data={data} onChange={handleDataChange} />;
    case 'skills':
      return <SkillsSection data={data} onChange={handleDataChange} />;
    case 'projects':
      return <ProjectsSection data={data} onChange={handleDataChange} />;
    case 'volunteer':
      return <VolunteerSection data={data} onChange={handleDataChange} />;
    case 'certifications':
      return <CertificationsSection data={data} onChange={handleDataChange} />;
    default:
      return <div>Section editor not available</div>;
  }
};

export default SectionEditor;
