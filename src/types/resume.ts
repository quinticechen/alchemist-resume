export interface PersonalInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  location: string;
  linkedIn: string;
}

export interface Experience {
  companyName: string;
  companyIntroduction: string;
  location: string;
  jobTitle: string;
  startDate: string;
  endDate: string;
  achievements: string[];
}

export interface Project {
  name: string;
  startDate: string;
  endDate: string;
  achievements: string[];
}

export interface Volunteer {
  name: string;
  startDate: string;
  endDate: string;
  achievements: string[];
}

export interface Education {
  degreeName: string;
  institution: string;
  enrollmentDate: string;
  graduationDate: string;
  gpa?: number;
}

export interface Skills {
  technical: string[];
  soft: string[];
}

export interface Certification {
  name: string;
  dateAchieved: string;
  expiredDate: string;
}

export interface GuidanceItem {
  guidance: string[];
}

export interface ResumeData {
  resume: {
    personalInfo: PersonalInfo;
    professionalSummary: string;
    professionalExperience: Experience[];
    projects: Project[];
    volunteer: Volunteer[];
    education: Education[];
    skills: Skills;
    certifications: Certification[];
    guidanceForOptimization?: GuidanceItem[];
  };
  sectionOrder?: string[];
  jobTitle?: string;
} 