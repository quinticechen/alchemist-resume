
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
  const data = resumeData?.resume || {};

  switch (section) {
    case 'personalInfo':
      return <PersonalInfoSection data={data} onChange={onChange} />;
    case 'professionalSummary':
      return <ProfessionalSummarySection data={data} onChange={onChange} />;
    case 'professionalExperience':
      return <ExperienceSection data={data} onChange={onChange} />;
    case 'education':
      return <EducationSection data={data} onChange={onChange} />;
    case 'skills':
      return <SkillsSection data={data} onChange={onChange} />;
    case 'projects':
      return <ProjectsSection data={data} onChange={onChange} />;
    case 'volunteer':
      return <VolunteerSection data={data} onChange={onChange} />;
    case 'certifications':
      return <CertificationsSection data={data} onChange={onChange} />;
    default:
      return <div>Section editor not available</div>;
  }
};

export default SectionEditor;
