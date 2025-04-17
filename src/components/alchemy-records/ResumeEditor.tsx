
import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonalInfoSection from "./sections/PersonalInfoSection";
import ProfessionalSummarySection from "./sections/ProfessionalSummarySection";
import ExperienceSection from "./sections/ExperienceSection";
import EducationSection from "./sections/EducationSection";
import SkillsSection from "./sections/SkillsSection";
import ProjectsSection from "./sections/ProjectsSection";
import CertificationsSection from "./sections/CertificationsSection";
import VolunteerSection from "./sections/VolunteerSection";
import SectionSelector from "./SectionSelector";
import SeekerOptimizationSection from "./SeekerOptimizationSection";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ResumeEditorProps {
  resumeId: string;
  goldenResume?: string | null;
  analysisId: string;
  setHasUnsavedChanges?: (hasChanges: boolean) => void;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ 
  resumeId, 
  goldenResume, 
  analysisId,
  setHasUnsavedChanges 
}) => {
  const [activeTab, setActiveTab] = useState("personalInfo");
  const [resumeContent, setResumeContent] = useState(
    goldenResume ? JSON.parse(goldenResume) : { resume: {} }
  );
  const { toast } = useToast();

  // Function to update specific section of resume
  const updateResumeSection = useCallback((section: string, data: any) => {
    setResumeContent(prev => ({
      ...prev,
      resume: {
        ...prev.resume,
        [section]: data
      }
    }));
    
    if (setHasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }
  }, [setHasUnsavedChanges]);

  // Get the initial resume content for the current section as a string
  const getInitialSectionContent = (section: string) => {
    const sectionContent = resumeContent.resume[section];
    return sectionContent ? JSON.stringify(sectionContent) : '';
  };

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="personalInfo">Personal Info</TabsTrigger>
          <TabsTrigger value="resume">Resume Details</TabsTrigger>
          <TabsTrigger value="optimize">Optimize</TabsTrigger>
        </TabsList>

        <TabsContent value="personalInfo">
          <PersonalInfoSection 
            data={resumeContent.resume.personalInfo} 
            onChange={(data) => updateResumeSection('personalInfo', data)} 
          />
        </TabsContent>

        <TabsContent value="resume">
          <Tabs orientation="vertical" value={activeTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="professionalSummary">Professional Summary</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
              <TabsTrigger value="volunteer">Volunteer</TabsTrigger>
            </TabsList>

            <TabsContent value="professionalSummary">
              <ProfessionalSummarySection 
                data={resumeContent.resume.professionalSummary} 
                onChange={(data) => updateResumeSection('professionalSummary', data)} 
              />
            </TabsContent>

            <TabsContent value="experience">
              <ExperienceSection 
                data={resumeContent.resume.professionalExperience} 
                onChange={(data) => updateResumeSection('professionalExperience', data)} 
              />
            </TabsContent>

            <TabsContent value="education">
              <EducationSection 
                data={resumeContent.resume.education} 
                onChange={(data) => updateResumeSection('education', data)} 
              />
            </TabsContent>

            <TabsContent value="skills">
              <SkillsSection 
                data={resumeContent.resume.skills} 
                onChange={(data) => updateResumeSection('skills', data)} 
              />
            </TabsContent>

            <TabsContent value="projects">
              <ProjectsSection 
                data={resumeContent.resume.projects} 
                onChange={(data) => updateResumeSection('projects', data)} 
              />
            </TabsContent>

            <TabsContent value="certifications">
              <CertificationsSection 
                data={resumeContent.resume.certifications} 
                onChange={(data) => updateResumeSection('certifications', data)} 
              />
            </TabsContent>

            <TabsContent value="volunteer">
              <VolunteerSection 
                data={resumeContent.resume.volunteer} 
                onChange={(data) => updateResumeSection('volunteer', data)} 
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="optimize">
          <SeekerOptimizationSection 
            optimizationData={null} 
            analysisId={analysisId}
            initialResumeContent={JSON.stringify(resumeContent.resume)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResumeEditor;
