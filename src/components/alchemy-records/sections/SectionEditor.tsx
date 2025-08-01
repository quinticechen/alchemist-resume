
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
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, GripVertical, Lock } from "lucide-react";

interface SectionEditorProps {
  section: ResumeSection;
  resumeData: any;
  onChange: (updatedData: any) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (section: ResumeSection) => void;
  isDraggable?: boolean;
  onAutoSave?: () => void;
}

const SectionEditor = ({ 
  section, 
  resumeData, 
  onChange, 
  isCollapsed = false, 
  onToggleCollapse,
  isDraggable = false,
  onAutoSave
}: SectionEditorProps) => {
  // Extract resume from the data structure if it exists, otherwise use the data as is
  const data = resumeData?.resume || resumeData || {};
  
  console.log(`SectionEditor for ${section} - isCollapsed:`, isCollapsed);

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
    
    // Call onAutoSave if provided to trigger saving to Supabase
    if (onAutoSave) {
      onAutoSave();
    }
  };

  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse(section);
    }
  };

  const renderSectionContent = () => {
    // Always pass showAddForm as true when not collapsed
    const showAddForm = !isCollapsed;
    
    console.log(`Rendering section ${section} with showAddForm:`, showAddForm);
    
    switch (section) {
      case 'personalInfo':
        return <PersonalInfoSection data={data} onChange={handleDataChange} />;
      case 'professionalSummary':
        return <ProfessionalSummarySection data={data} onChange={handleDataChange} />;
      case 'professionalExperience':
        return <ExperienceSection data={data} onChange={handleDataChange} showAddForm={showAddForm} />;
      case 'education':
        return <EducationSection data={data} onChange={handleDataChange} showAddForm={showAddForm} />;
      case 'skills':
        return <SkillsSection data={data} onChange={handleDataChange} showAddForm={showAddForm} />;
      case 'projects':
        return <ProjectsSection data={data} onChange={handleDataChange} showAddForm={showAddForm} />;
      case 'volunteer':
        return <VolunteerSection data={data} onChange={handleDataChange} showAddForm={showAddForm} />;
      case 'certifications':
        return <CertificationsSection data={data} onChange={handleDataChange} showAddForm={showAddForm} />;
      default:
        return <div>Section editor not available</div>;
    }
  };

  // Personal info section is special - not draggable and has a lock icon
  const isPersonalInfo = section === 'personalInfo';

  return (
    <div className="mb-6 border rounded-md shadow-sm">
      <div className="bg-gray-50 p-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-2">
          {isDraggable && !isPersonalInfo && (
            <div className="cursor-grab">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
          )}
          {isPersonalInfo && <Lock className="h-4 w-4 text-gray-400" />}
          <h3 className="text-lg font-medium">{getSectionDisplayName(section)}</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleToggleCollapse} 
          className="p-1 h-8 w-8"
          type="button"
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>
      
      {!isCollapsed && (
        <div className="p-4">
          {renderSectionContent()}
        </div>
      )}
    </div>
  );
};

export default SectionEditor;
