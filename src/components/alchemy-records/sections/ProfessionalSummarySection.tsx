
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ProfessionalSummarySectionProps {
  data: any;
  onChange: (updatedData: any) => void;
}

const ProfessionalSummarySection = ({ data, onChange }: ProfessionalSummarySectionProps) => {
  // Log the data structure to help with debugging
  console.log('ProfessionalSummarySection data:', data);
  
  // Check for both field names - some data models use 'summary' and others use 'professionalSummary'
  const professionalSummary = data?.professionalSummary || data?.summary || '';

  const handleChange = (value: string) => {
    // Update both fields for compatibility
    onChange({
      ...data,
      professionalSummary: value,
      summary: value
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="professionalSummary">Professional Summary</Label>
        <Textarea 
          id="professionalSummary"
          rows={8}
          value={professionalSummary}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Write a concise summary of your professional background, skills, and career objectives..."
          className="min-h-[200px]"
        />
      </div>
    </div>
  );
};

export default ProfessionalSummarySection;
