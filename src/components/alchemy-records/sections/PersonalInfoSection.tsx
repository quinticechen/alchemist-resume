
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PersonalInfo {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  linkedIn?: string;
  summary?: string;
  professionalSummary?: string;
}

interface PersonalInfoSectionProps {
  data: { personalInfo?: PersonalInfo } | PersonalInfo;
  onChange: (field: string, value: string) => void;
}

const PersonalInfoSection = ({ data, onChange }: PersonalInfoSectionProps) => {
  // Extract personalInfo from nested structure or use data directly
  const personalInfo = 'personalInfo' in data ? data.personalInfo || {} : data || {};
  
  const handleFieldChange = (field: string, value: string) => {
    // Update the personalInfo section specifically
    onChange('personalInfo', {
      ...personalInfo,
      [field]: value
    });
  };

  // Get the full name from firstName + lastName or use name field
  const fullName = personalInfo.firstName && personalInfo.lastName 
    ? `${personalInfo.firstName} ${personalInfo.lastName}`.trim()
    : personalInfo.name || '';

  const handleFullNameChange = (value: string) => {
    const nameParts = value.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    onChange('personalInfo', {
      ...personalInfo,
      firstName,
      lastName,
      name: value
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
          <Input
            id="name"
            value={fullName}
            onChange={(e) => handleFullNameChange(e.target.value)}
            placeholder="Enter your full name"
            className="mt-1 text-gray-900 placeholder-gray-400 bg-white border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            value={personalInfo.email || ''}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            placeholder="Enter your email"
            className="mt-1 text-gray-900 placeholder-gray-400 bg-white border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="phone" className="text-gray-700 font-medium">Phone</Label>
          <Input
            id="phone"
            value={personalInfo.phone || ''}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            placeholder="Enter your phone number"
            className="mt-1 text-gray-900 placeholder-gray-400 bg-white border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="website" className="text-gray-700 font-medium">Website</Label>
          <Input
            id="website"
            value={personalInfo.website || ''}
            onChange={(e) => handleFieldChange('website', e.target.value)}
            placeholder="Enter your website URL"
            className="mt-1 text-gray-900 placeholder-gray-400 bg-white border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="linkedin" className="text-gray-700 font-medium">LinkedIn</Label>
          <Input
            id="linkedin"
            value={personalInfo.linkedin || personalInfo.linkedIn || ''}
            onChange={(e) => handleFieldChange('linkedin', e.target.value)}
            placeholder="Enter your LinkedIn profile URL"
            className="mt-1 text-gray-900 placeholder-gray-400 bg-white border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="address" className="text-gray-700 font-medium">Address</Label>
          <Input
            id="address"
            value={personalInfo.address || personalInfo.location || ''}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            placeholder="Enter your address"
            className="mt-1 text-gray-900 placeholder-gray-400 bg-white border-gray-300"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="summary" className="text-gray-700 font-medium">Professional Summary</Label>
        <Textarea
          id="summary"
          value={personalInfo.summary || personalInfo.professionalSummary || ''}
          onChange={(e) => handleFieldChange('summary', e.target.value)}
          placeholder="Enter a brief professional summary"
          className="min-h-[100px] mt-1 text-gray-900 placeholder-gray-400 bg-white border-gray-300"
        />
      </div>
    </div>
  );
};

export default PersonalInfoSection;
