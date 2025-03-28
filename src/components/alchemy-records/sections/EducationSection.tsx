
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
}

const EducationSection = ({ data, onChange }: EducationSectionProps) => {
  const [activeEduIndex, setActiveEduIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ [key: string]: string }>({});
  
  const educationList = data?.education || [];
  
  const initEditForm = (idx: number | null) => {
    if (idx !== null && educationList[idx]) {
      const edu = educationList[idx];
      setEditing({
        degreeName: edu.degreeName || '',
        institution: edu.institution || '',
        graduationDate: edu.graduationDate || '',
        gpa: edu.gpa?.toString() || '',
      });
    } else {
      setEditing({
        degreeName: '',
        institution: '',
        graduationDate: '',
        gpa: '',
      });
    }
    setActiveEduIndex(idx);
  };
  
  const handleSaveEducation = () => {
    const updatedEducation = [...educationList];
    
    const educationItem = {
      ...editing,
      gpa: editing.gpa ? parseFloat(editing.gpa) : undefined
    };
    
    if (activeEduIndex !== null) {
      // Update existing item
      updatedEducation[activeEduIndex] = educationItem;
    } else {
      // Add new item
      updatedEducation.push(educationItem);
    }
    
    onChange({
      ...data,
      education: updatedEducation
    });
    
    // Reset form
    setActiveEduIndex(null);
  };
  
  const handleRemoveEducation = (idx: number) => {
    const updatedEducation = [...educationList];
    updatedEducation.splice(idx, 1);
    
    onChange({
      ...data,
      education: updatedEducation
    });
    
    if (activeEduIndex === idx) {
      setActiveEduIndex(null);
    }
  };
  
  const handleMoveEducation = (idx: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && idx === 0) || 
        (direction === 'down' && idx === educationList.length - 1)) {
      return;
    }
    
    const updatedEducation = [...educationList];
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    
    [updatedEducation[idx], updatedEducation[newIdx]] = 
      [updatedEducation[newIdx], updatedEducation[idx]];
    
    onChange({
      ...data,
      education: updatedEducation
    });
    
    if (activeEduIndex === idx) {
      setActiveEduIndex(newIdx);
    } else if (activeEduIndex === newIdx) {
      setActiveEduIndex(idx);
    }
  };
  
  const handleEditingChange = (field: string, value: string) => {
    setEditing({
      ...editing,
      [field]: value
    });
  };

  return (
    <div className="space-y-4">
      {activeEduIndex === null && (
        <>
          <Button 
            onClick={() => initEditForm(null)} 
            className="mb-4" 
            variant="outline"
          >
            <PlusCircle className="h-4 w-4 mr-2" />Add Education
          </Button>
          
          {educationList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Degree</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Graduation Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {educationList.map((edu: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{edu.degreeName}</TableCell>
                    <TableCell>{edu.institution}</TableCell>
                    <TableCell>{edu.graduationDate}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => initEditForm(idx)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveEducation(idx)}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMoveEducation(idx, 'up')}
                          disabled={idx === 0}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMoveEducation(idx, 'down')}
                          disabled={idx === educationList.length - 1}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-md">
              No education entries yet. Click "Add Education" to get started.
            </div>
          )}
        </>
      )}
      
      {activeEduIndex !== null && (
        <Card>
          <CardHeader>
            <CardTitle>
              {activeEduIndex === null ? 'Add Education' : 'Edit Education'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="degreeName">Degree Name</Label>
              <Input 
                id="degreeName" 
                value={editing.degreeName} 
                onChange={(e) => handleEditingChange('degreeName', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Input 
                id="institution" 
                value={editing.institution} 
                onChange={(e) => handleEditingChange('institution', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="graduationDate">Graduation Date (YYYY-MM)</Label>
                <Input 
                  id="graduationDate" 
                  value={editing.graduationDate} 
                  onChange={(e) => handleEditingChange('graduationDate', e.target.value)}
                  placeholder="YYYY-MM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gpa">GPA (Optional)</Label>
                <Input 
                  id="gpa" 
                  value={editing.gpa} 
                  onChange={(e) => handleEditingChange('gpa', e.target.value)}
                  placeholder="e.g. 3.8"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setActiveEduIndex(null)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEducation}
            >
              Save Education
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default EducationSection;
