
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

interface ProfessionalSummarySectionProps {
  data: any;
  onChange: (updatedData: any) => void;
}

const ProfessionalSummarySection = ({ data, onChange }: ProfessionalSummarySectionProps) => {
  const { t } = useTranslation(['resume-refine']);
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
        <Label htmlFor="professionalSummary">{t('professionalSummary.title')}</Label>
        <Textarea 
          id="professionalSummary"
          rows={8}
          value={professionalSummary}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={t('professionalSummary.placeholder')}
          className="min-h-[200px]"
        />
      </div>
    </div>
  );
};

export default ProfessionalSummarySection;
