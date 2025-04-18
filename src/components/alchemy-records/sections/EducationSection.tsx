
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
  
  // Handle the case where education is an array or a single object or nested inside resume
  const educationArray = Array.isArray(data?.education) 
    ? data.education 
    : Array.isArray(data?.resume?.education) 
      ? data.resume.education 
      : (data?.education ? [data.education] : []);
  
  const initEditForm = (idx: number | null) => {
    if (idx !== null && idx >= 0 && educationArray[idx]) {
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
    
    // Check if we're dealing with the nested structure
    if (data?.resume?.education) {
      onChange({
        ...data,
        resume: {
          ...data.resume,
          education: updatedEducation
        }
      });
    } else {
      onChange({
        ...data,
        education: updatedEducation
      });
    }
    
    // Reset form
    setActiveEduIndex(null);
    setEditing({
      degreeName: '',
      institution: '',
      enrollmentDate: '',
      graduationDate: '',
      gpa: '',
    });
  };
  
  const handleAddEducationClick = () => {
    initEditForm(null);
  };

  const handleDeleteEducation = (index: number) => {
    const updatedEducation = [...educationArray];
    updatedEducation.splice(index, 1);
    
    // Check if we're dealing with the nested structure
    if (data?.resume?.education) {
      onChange({
        ...data,
        resume: {
          ...data.resume,
          education: updatedEducation
        }
      });
    } else {
      onChange({
        ...data,
        education: updatedEducation
      });
    }
  };

  const handleEditEducation = (index: number) => {
    initEditForm(index);
  };

  return (
    <div className="flex flex-col space-y-4">
      {activeEduIndex !== null ? (
        <div className="border p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">
            {activeEduIndex >= 0 ? "Edit Education" : "Add Education"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="degreeName">Degree</Label>
              <Input
                id="degreeName"
                value={editing.degreeName}
                onChange={(e) => setEditing({ ...editing, degreeName: e.target.value })}
                placeholder="e.g., Bachelor of Science"
              />
            </div>
            <div>
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={editing.institution}
                onChange={(e) => setEditing({ ...editing, institution: e.target.value })}
                placeholder="e.g., University of California"
              />
            </div>
            <div>
              <Label htmlFor="enrollmentDate">Start Date</Label>
              <Input
                id="enrollmentDate"
                value={editing.enrollmentDate}
                onChange={(e) => setEditing({ ...editing, enrollmentDate: e.target.value })}
                placeholder="e.g., 2018"
              />
            </div>
            <div>
              <Label htmlFor="graduationDate">Graduation Date</Label>
              <Input
                id="graduationDate"
                value={editing.graduationDate}
                onChange={(e) => setEditing({ ...editing, graduationDate: e.target.value })}
                placeholder="e.g., 2022 or Present"
              />
            </div>
            <div>
              <Label htmlFor="gpa">GPA</Label>
              <Input
                id="gpa"
                value={editing.gpa}
                onChange={(e) => setEditing({ ...editing, gpa: e.target.value })}
                placeholder="e.g., 3.8"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setActiveEduIndex(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEducation}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          {educationArray.length > 0 ? (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Degree</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>Graduation</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {educationArray.map((edu: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{edu.degreeName}</TableCell>
                      <TableCell>{edu.institution}</TableCell>
                      <TableCell>{edu.graduationDate}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditEducation(index)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteEducation(index)}
                            className="text-red-500"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-md">
              <p className="text-gray-500">No education entries yet.</p>
            </div>
          )}

          {showAddForm && (
            <Button
              variant="outline"
              className="flex items-center"
              onClick={handleAddEducationClick}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Education
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default EducationSection;
