export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location?: string;
  linkedIn?: string;
}

export interface Experience {
  jobTitle: string;
  companyName: string;
  location?: string;
  startDate: string;
  endDate?: string;
  companyIntroduction?: string;
  achievements?: string[];
}

export interface Project {
  name: string;
  startDate?: string;
  endDate?: string;
  achievements?: string[];
}

export interface Volunteer {
  name: string;
  startDate?: string;
  endDate?: string;
  achievements?: string[];
}

export interface Education {
  degreeName: string;
  institution: string;
  enrollmentDate?: string;
  graduationDate: string;
  gpa?: string;
  description?: string;
}

export interface Skills {
  technical: string[];
  soft: string[];
}

export interface Certification {
  name: string;
  dateAchieved?: string;
  expiredDate?: string;
}

export interface GuidanceItem {
  section: string;
  suggestions: string[];
}

export interface Resume {
  personalInfo: PersonalInfo;
  professionalSummary: string;
  summary?: string;
  professionalExperience: Experience[];
  projects: Project[];
  volunteer: Volunteer[];
  education: Education[];
  skills: Skills;
  certifications: Certification[];
  guidanceForOptimization?: GuidanceItem[];
}

export interface ResumeData {
  resume: Resume;
  sectionOrder?: ResumeSection[];
  jobTitle?: string;
}

export type ResumeSection = 
  | 'personalInfo'
  | 'professionalSummary'
  | 'professionalExperience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'volunteer'
  | 'certifications';

export interface ResumeAnalysis {
  id: string;
  user_id: string;
  job_id: string;
  created_at: string;
  status: string;
  job?: {
    job_title?: string;
  };
} 