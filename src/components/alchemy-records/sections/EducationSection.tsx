import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusCircle, MinusCircle, MoveUp, MoveDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface EducationSectionProps {
  data: any;
  onChange: (updatedData: any) => void;
  showAddForm?: boolean;
}

const EducationSection = ({ data, onChange, showAddForm = true }: EducationSectionProps) => {
  const [activeEduIndex, setActiveEduIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ [key: string]: string }>({
    degreeName: '',
    institution: '',
    enrollmentDate: '',
    graduationDate: '',
    gpa: '',
  });
  
  // Handle the case where education is an array or a single object
  const educationArray = Array.isArray(data?.education) 
    ? data.education 
    : (data?.education ? [data.education] : []);
  
  const initEditForm = (idx: number | null) => {
    if (idx !== null && educationArray[idx]) {
      const edu = educationArray[idx];
      setEditing({
        degreeName: edu.degreeName || '',
        institution: edu.institution || '',
        enrollmentDate: edu.enrollmentDate || '',
        graduationDate: edu.graduationDate || '',
        gpa: edu.gpa?.toString() || '',
      });
    } else {
      setEditing({
        degreeName: '',
        institution: '',
        enrollmentDate: '',
        graduationDate: '',
        gpa: '',
      });
    }
    setActiveEduIndex(idx);
  };
  
  const handleSaveEducation = () => {
    const updatedEducation = [...educationArray];
    
    if (activeEduIndex !== null && activeEduIndex >= 0) {
      // Update existing item
      updatedEducation[activeEduIndex] = editing;
    } else {
      // Add new item (activeEduIndex === null or activeEduIndex === -1)
      updatedEducation.push(editing);
    }
    
    onChange({
      ...data,
      education: updatedEducation
    });
    
    // Reset form
    setActiveEduIndex(null);
  };
  
  const handleAddEducationClick = () => {
    initEditForm(null);
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Rest of the component code remains unchanged */}
    </div>
  );
};

export default EducationSection;