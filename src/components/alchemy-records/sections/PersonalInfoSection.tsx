
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  linkedin?: string;
  summary?: string;
}

interface PersonalInfoSectionProps {
  data: PersonalInfo;
  onChange: (field: string, value: string) => void;
}

const PersonalInfoSection = ({ data, onChange }: PersonalInfoSectionProps) => {
  const handleFieldChange = (field: string, value: string) => {
    onChange(field, value);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
          <Input
            id="name"
            value={data.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="Enter your full name"
            className="mt-1 text-gray-900 placeholder-gray-400"
          />
        </div>
        <div>
          <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            value={data.email || ''}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            placeholder="Enter your email"
            className="mt-1 text-gray-900 placeholder-gray-400"
          />
        </div>
        <div>
          <Label htmlFor="phone" className="text-gray-700 font-medium">Phone</Label>
          <Input
            id="phone"
            value={data.phone || ''}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            placeholder="Enter your phone number"
            className="mt-1 text-gray-900 placeholder-gray-400"
          />
        </div>
        <div>
          <Label htmlFor="website" className="text-gray-700 font-medium">Website</Label>
          <Input
            id="website"
            value={data.website || ''}
            onChange={(e) => handleFieldChange('website', e.target.value)}
            placeholder="Enter your website URL"
            className="mt-1 text-gray-900 placeholder-gray-400"
          />
        </div>
        <div>
          <Label htmlFor="linkedin" className="text-gray-700 font-medium">LinkedIn</Label>
          <Input
            id="linkedin"
            value={data.linkedin || ''}
            onChange={(e) => handleFieldChange('linkedin', e.target.value)}
            placeholder="Enter your LinkedIn profile URL"
            className="mt-1 text-gray-900 placeholder-gray-400"
          />
        </div>
        <div>
          <Label htmlFor="address" className="text-gray-700 font-medium">Address</Label>
          <Input
            id="address"
            value={data.address || ''}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            placeholder="Enter your address"
            className="mt-1 text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="summary" className="text-gray-700 font-medium">Professional Summary</Label>
        <Textarea
          id="summary"
          value={data.summary || ''}
          onChange={(e) => handleFieldChange('summary', e.target.value)}
          placeholder="Enter a brief professional summary"
          className="min-h-[100px] mt-1 text-gray-900 placeholder-gray-400"
        />
      </div>
    </div>
  );
};

export default PersonalInfoSection;
