
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
          <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name</Label>
          <Input
            id="firstName"
            value={personalInfo.firstName || ''}
            onChange={(e) => handleFieldChange('firstName', e.target.value)}
            placeholder="Enter your first name"
            className="mt-1 text-gray-900 placeholder-gray-400 bg-white border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name</Label>
          <Input
            id="lastName"
            value={personalInfo.lastName || ''}
            onChange={(e) => handleFieldChange('lastName', e.target.value)}
            placeholder="Enter your last name"
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
          <Label htmlFor="location" className="text-gray-700 font-medium">Location</Label>
          <Input
            id="location"
            value={personalInfo.location || ''}
            onChange={(e) => handleFieldChange('location', e.target.value)}
            placeholder="Enter your location"
            className="mt-1 text-gray-900 placeholder-gray-400 bg-white border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="linkedIn" className="text-gray-700 font-medium">LinkedIn</Label>
          <Input
            id="linkedIn"
            value={personalInfo.linkedIn || ''}
            onChange={(e) => handleFieldChange('linkedIn', e.target.value)}
            placeholder="Enter your LinkedIn profile URL"
            className="mt-1 text-gray-900 placeholder-gray-400 bg-white border-gray-300"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="website" className="text-gray-700 font-medium">Website</Label>
          <Input
            id="website"
            value={personalInfo.website || ''}
            onChange={(e) => handleFieldChange('website', e.target.value)}
            placeholder="Enter your website URL"
            className="mt-1 text-gray-900 placeholder-gray-400 bg-white border-gray-300"
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoSection;
