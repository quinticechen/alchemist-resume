
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

  const getSectionProps = () => {
    const props = {
      data,
      onChange: handleDataChange
    };
    
    // Add specific showAddForm prop for each section that needs it
    if (section === 'professionalExperience' || 
        section === 'education' ||
        section === 'projects' ||
        section === 'skills' ||
        section === 'volunteer' ||
        section === 'certifications') {
      return {
        ...props,
        showAddForm: true
      };
    }
    
    return props;
  };

  switch (section) {
    case 'personalInfo':
      return <PersonalInfoSection data={data} onChange={handleDataChange} />;
    case 'professionalSummary':
      return <ProfessionalSummarySection data={data} onChange={handleDataChange} />;
    case 'professionalExperience':
      return <ExperienceSection {...getSectionProps()} />;
    case 'education':
      return <EducationSection {...getSectionProps()} />;
    case 'skills':
      return <SkillsSection {...getSectionProps()} />;
    case 'projects':
      return <ProjectsSection {...getSectionProps()} />;
    case 'volunteer':
      return <VolunteerSection {...getSectionProps()} />;
    case 'certifications':
      return <CertificationsSection {...getSectionProps()} />;
    default:
      return <div>Section editor not available</div>;
  }
};

export default SectionEditor;
