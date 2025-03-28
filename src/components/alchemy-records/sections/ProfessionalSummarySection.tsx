
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ProfessionalSummarySectionProps {
  data: any;
  onChange: (updatedData: any) => void;
}

const ProfessionalSummarySection = ({ data, onChange }: ProfessionalSummarySectionProps) => {
  const handleChange = (value: string) => {
    onChange({
      ...data,
      professionalSummary: value
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="professionalSummary">Professional Summary</Label>
        <Textarea 
          id="professionalSummary"
          rows={8}
          value={data?.professionalSummary || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Write a concise summary of your professional background, skills, and career objectives..."
          className="min-h-[200px]"
        />
      </div>
    </div>
  );
};

export default ProfessionalSummarySection;
