
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PersonalInfoSectionProps {
  data: any;
  onChange: (updatedData: any) => void;
}

const PersonalInfoSection = ({ data, onChange }: PersonalInfoSectionProps) => {
  const personalInfo = data?.personalInfo || {};

  const handleChange = (field: string, value: string) => {
    const updatedPersonalInfo = {
      ...personalInfo,
      [field]: value
    };
    
    onChange({
      ...data,
      personalInfo: updatedPersonalInfo
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input 
            id="firstName" 
            value={personalInfo.firstName || ''} 
            onChange={(e) => handleChange('firstName', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input 
            id="lastName" 
            value={personalInfo.lastName || ''} 
            onChange={(e) => handleChange('lastName', e.target.value)}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          type="email" 
          value={personalInfo.email || ''} 
          onChange={(e) => handleChange('email', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input 
          id="phone" 
          value={personalInfo.phone || ''} 
          onChange={(e) => handleChange('phone', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input 
          id="location" 
          value={personalInfo.location || ''} 
          onChange={(e) => handleChange('location', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="linkedIn">LinkedIn URL</Label>
        <Input 
          id="linkedIn" 
          value={personalInfo.linkedIn || ''} 
          onChange={(e) => handleChange('linkedIn', e.target.value)}
        />
      </div>
    </div>
  );
};

export default PersonalInfoSection;
