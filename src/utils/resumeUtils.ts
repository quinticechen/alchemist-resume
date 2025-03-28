
// Resume section types for the editor
export type ResumeSection = 
  | 'personalInfo'
  | 'professionalSummary'
  | 'professionalExperience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'volunteer'
  | 'certifications';

// Helper function to get display names for sections
export const getSectionDisplayName = (section: ResumeSection): string => {
  const displayNames: Record<ResumeSection, string> = {
    personalInfo: 'Personal Information',
    professionalSummary: 'Professional Summary',
    professionalExperience: 'Professional Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    volunteer: 'Volunteer Experience',
    certifications: 'Certifications'
  };
  
  return displayNames[section] || section;
};

// Get all available sections for navigation
export const getAllSections = (): ResumeSection[] => {
  return [
    'personalInfo',
    'professionalSummary',
    'professionalExperience',
    'education',
    'skills',
    'projects',
    'volunteer',
    'certifications'
  ];
};

// Helper to format the resume data for display
export const getFormattedResume = (resumeContent: any): any => {
  try {
    if (typeof resumeContent === 'string') {
      return JSON.parse(resumeContent);
    }
    return resumeContent;
  } catch (e) {
    console.error('Error parsing resume content:', e);
    return {};
  }
};
