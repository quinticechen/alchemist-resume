
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

interface PersonalInfo {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  location?: string;
  linkedIn?: string;
  website?: string;
}

interface PersonalInfoSectionProps {
  data: any; // The resume data object
  onChange: (updatedData: any) => void; // Function to update the entire resume data
}

const PersonalInfoSection = ({ data, onChange }: PersonalInfoSectionProps) => {
  const { t } = useTranslation(['resume-refine']);
  // Extract personalInfo from the data
  const personalInfo: PersonalInfo = data?.personalInfo || {};
  
  console.log('PersonalInfoSection render - personalInfo:', personalInfo);
  console.log('PersonalInfoSection render - raw data:', data);
  
  const handleFieldChange = (field: string, value: string) => {
    console.log(`PersonalInfoSection: Updating field ${field} with value:`, value);
    
    // Create updated personalInfo object
    const updatedPersonalInfo: PersonalInfo = {
      ...personalInfo,
      [field]: value
    };
    
    console.log('Updated personalInfo:', updatedPersonalInfo);
    
    // Create the complete updated data structure
    const updatedData = {
      ...data,
      personalInfo: updatedPersonalInfo
    };
    
    console.log('Complete updated data:', updatedData);
    
    // Pass the entire updated data structure to parent
    onChange(updatedData);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName" className="text-gray-700 font-medium">{t('personalInfo.firstName')}</Label>
          <Input
            id="firstName"
            value={personalInfo.firstName || ''}
            onChange={(e) => handleFieldChange('firstName', e.target.value)}
            placeholder={t('personalInfo.firstNamePlaceholder')}
            className="mt-1 text-gray-900 placeholder-gray-400 bg-white border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="text-gray-700 font-medium">{t('personalInfo.lastName')}</Label>
          <Input
            id="lastName"
            value={personalInfo.lastName || ''}
            onChange={(e) => handleFieldChange('lastName', e.target.value)}
            placeholder={t('personalInfo.lastNamePlaceholder')}
            className="mt-1 text-gray-900 placeholder-gray-400 bg-white border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="email" className="text-gray-700 font-medium">{t('personalInfo.email')}</Label>
          <Input
            id="email"
            type="email"
            value={personalInfo.email || ''}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            placeholder={t('personalInfo.emailPlaceholder')}
            className="mt-1 text-gray-900 placeholder-gray-400 bg-white border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="phone" className="text-gray-700 font-medium">{t('personalInfo.phone')}</Label>
          <Input
            id="phone"
            value={personalInfo.phone || ''}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            placeholder={t('personalInfo.phonePlaceholder')}
            className="mt-1 text-gray-900 placeholder-gray-400 bg-white border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="location" className="text-gray-700 font-medium">{t('personalInfo.location')}</Label>
          <Input
            id="location"
            value={personalInfo.location || ''}
            onChange={(e) => handleFieldChange('location', e.target.value)}
            placeholder={t('personalInfo.locationPlaceholder')}
            className="mt-1 text-gray-900 placeholder-gray-400 bg-white border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="linkedIn" className="text-gray-700 font-medium">{t('personalInfo.linkedIn')}</Label>
          <Input
            id="linkedIn"
            value={personalInfo.linkedIn || ''}
            onChange={(e) => handleFieldChange('linkedIn', e.target.value)}
            placeholder={t('personalInfo.linkedInPlaceholder')}
            className="mt-1 text-gray-900 placeholder-gray-400 bg-white border-gray-300"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="website" className="text-gray-700 font-medium">{t('personalInfo.website')}</Label>
          <Input
            id="website"
            value={personalInfo.website || ''}
            onChange={(e) => handleFieldChange('website', e.target.value)}
            placeholder={t('personalInfo.websitePlaceholder')}
            className="mt-1 text-gray-900 placeholder-gray-400 bg-white border-gray-300"
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoSection;
