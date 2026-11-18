import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusCircle, MinusCircle, MoveUp, MoveDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface EducationSectionProps {
  data: any;
  onChange: (updatedData: any) => void;
  showAddForm?: boolean;
}

const EducationSection = ({ data, onChange, showAddForm = true }: EducationSectionProps) => {
  const { t } = useTranslation(['resume-refine']);
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
  
  console.log('Education data:', educationArray);
  console.log('showAddForm prop:', showAddForm);
  
  const initEditForm = (idx: number | null) => {
    console.log('Initializing education edit form with index:', idx);
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
    console.log('Active education index set to:', idx);
  };
  
  const handleSaveEducation = () => {
    console.log('Save Education button clicked');
    console.log('Current editing data:', editing);
    console.log('Current activeEduIndex:', activeEduIndex);
    
    const updatedEducation = [...educationArray];
    
    if (activeEduIndex !== null && activeEduIndex >= 0) {
      // Update existing item
      updatedEducation[activeEduIndex] = editing;
    } else {
      // Add new item (activeEduIndex === null or activeEduIndex === -1)
      updatedEducation.push(editing);
    }
    
    console.log('Updated education list before save:', updatedEducation);
    
    onChange({
      ...data,
      education: updatedEducation
    });
    
    // Reset form
    setActiveEduIndex(null);
    console.log('Form reset, activeEduIndex set to null');
  };
  
  const handleRemoveEducation = (idx: number) => {
    const updatedEducation = [...educationArray];
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
        (direction === 'down' && idx === educationArray.length - 1)) {
      return;
    }
    
    const updatedEducation = [...educationArray];
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

  const handleAddEducationClick = () => {
    console.log('Add Education button clicked');
    initEditForm(null);
  };

  return (
    <div className="space-y-4">
      {activeEduIndex === null ? (
        <>
          {showAddForm && (
            <Button 
              onClick={() => {
                console.log('Direct button click handler for Education');
                // 使用-1表示這是一個新添加操作
                setActiveEduIndex(-1);
                setEditing({
                  degreeName: '',
                  institution: '',
                  enrollmentDate: '',
                  graduationDate: '',
                  gpa: ''
                });
                console.log('activeEduIndex set to -1 to indicate new item');
              }}
              className="mb-4" 
              variant="outline"
              type="button"
            >
              <PlusCircle className="h-4 w-4 mr-2" />{t('resume-refine:education.addEducation')}
            </Button>
          )}
          
          {educationArray.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('resume-refine:education.degree')}</TableHead>
                  <TableHead>{t('resume-refine:education.institution')}</TableHead>
                  <TableHead>{t('resume-refine:education.dates')}</TableHead>
                  <TableHead>{t('resume-refine:education.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {educationArray.map((edu: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{edu.degreeName}</TableCell>
                    <TableCell>{edu.institution}</TableCell>
                    <TableCell>
                      {edu.enrollmentDate && edu.graduationDate ? 
                        `${edu.enrollmentDate} to ${edu.graduationDate}` : 
                        edu.graduationDate || 'No date'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => initEditForm(idx)}
                          type="button"
                        >
                          {t('resume-refine:education.edit')}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveEducation(idx)}
                          type="button"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMoveEducation(idx, 'up')}
                          disabled={idx === 0}
                          type="button"
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMoveEducation(idx, 'down')}
                          disabled={idx === educationArray.length - 1}
                          type="button"
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
              {t('resume-refine:education.noEducation')}
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {activeEduIndex >= 0 ? t('resume-refine:education.editEducation') : t('resume-refine:education.addEducation')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="degreeName">{t('resume-refine:education.degreeName')}</Label>
              <Input 
                id="degreeName" 
                value={editing.degreeName} 
                onChange={(e) => handleEditingChange('degreeName', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="institution">{t('resume-refine:education.institution')}</Label>
              <Input 
                id="institution" 
                value={editing.institution} 
                onChange={(e) => handleEditingChange('institution', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="enrollmentDate">{t('resume-refine:education.enrollmentDate')}</Label>
                <Input 
                  id="enrollmentDate" 
                  value={editing.enrollmentDate} 
                  onChange={(e) => handleEditingChange('enrollmentDate', e.target.value)}
                  placeholder={t('resume-refine:education.enrollmentDatePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="graduationDate">{t('resume-refine:education.graduationDate')}</Label>
                <Input 
                  id="graduationDate" 
                  value={editing.graduationDate} 
                  onChange={(e) => handleEditingChange('graduationDate', e.target.value)}
                  placeholder={t('resume-refine:education.graduationDatePlaceholder')}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gpa">{t('resume-refine:education.gpa')}</Label>
              <Input 
                id="gpa" 
                value={editing.gpa} 
                onChange={(e) => handleEditingChange('gpa', e.target.value)}
                placeholder={t('resume-refine:education.gpaPlaceholder')}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setActiveEduIndex(null)}
              type="button"
            >
              {t('resume-refine:education.cancel')}
            </Button>
            <Button 
              onClick={handleSaveEducation}
              type="button"
            >
              {t('resume-refine:education.saveEducation')}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default EducationSection;
