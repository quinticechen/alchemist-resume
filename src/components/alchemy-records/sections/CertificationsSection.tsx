import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusCircle, MinusCircle, MoveUp, MoveDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface CertificationsSectionProps {
  data: any;
  onChange: (updatedData: any) => void;
  showAddForm?: boolean;
}

const CertificationsSection = ({ data, onChange, showAddForm = true }: CertificationsSectionProps) => {
  const { t } = useTranslation(['resume-refine']);
  const [activeCertIndex, setActiveCertIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ [key: string]: string }>({
    name: '',
    dateAchieved: '',
    expiredDate: '',
  });
  
  const certificationsList = Array.isArray(data?.certifications) ? data.certifications : [];
  
  console.log('Certifications data:', certificationsList);
  console.log('showAddForm prop:', showAddForm);
  
  const initEditForm = (idx: number | null) => {
    console.log('Initializing edit form with index:', idx);
    if (idx !== null && certificationsList[idx]) {
      const cert = certificationsList[idx];
      setEditing({
        name: cert.name || '',
        dateAchieved: cert.dateAchieved || '',
        expiredDate: cert.expiredDate || '',
      });
    } else {
      setEditing({
        name: '',
        dateAchieved: '',
        expiredDate: '',
      });
    }
    setActiveCertIndex(idx);
    console.log('Active certification index set to:', idx);
  };
  
  const handleSaveCertification = () => {
    console.log('Save Certification button clicked');
    console.log('Current editing data:', editing);
    console.log('Current activeCertIndex:', activeCertIndex);
    
    const updatedCertifications = [...certificationsList];
    
    if (activeCertIndex !== null && activeCertIndex >= 0) {
      // Update existing item
      updatedCertifications[activeCertIndex] = editing;
    } else {
      // Add new item (activeCertIndex === null or activeCertIndex === -1)
      updatedCertifications.push(editing);
    }
    
    console.log('Updated certifications list before save:', updatedCertifications);
    
    onChange({
      ...data,
      certifications: updatedCertifications
    });
    
    // Reset form
    setActiveCertIndex(null);
    console.log('Form reset, activeCertIndex set to null');
  };
  
  const handleRemoveCertification = (idx: number) => {
    const updatedCertifications = [...certificationsList];
    updatedCertifications.splice(idx, 1);
    
    onChange({
      ...data,
      certifications: updatedCertifications
    });
    
    if (activeCertIndex === idx) {
      setActiveCertIndex(null);
    }
  };
  
  const handleMoveCertification = (idx: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && idx === 0) || 
        (direction === 'down' && idx === certificationsList.length - 1)) {
      return;
    }
    
    const updatedCertifications = [...certificationsList];
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    
    [updatedCertifications[idx], updatedCertifications[newIdx]] = 
      [updatedCertifications[newIdx], updatedCertifications[idx]];
    
    onChange({
      ...data,
      certifications: updatedCertifications
    });
    
    if (activeCertIndex === idx) {
      setActiveCertIndex(newIdx);
    } else if (activeCertIndex === newIdx) {
      setActiveCertIndex(idx);
    }
  };
  
  const handleEditingChange = (field: string, value: string) => {
    setEditing({
      ...editing,
      [field]: value
    });
  };

  const handleAddCertClick = () => {
    console.log('Add Certification button clicked');
    initEditForm(null);
  };

  return (
    <div className="space-y-4">
      {activeCertIndex === null ? (
        <>
          {showAddForm && (
            <Button
              onClick={() => {
                console.log('Direct button click handler for Certification');
                // 使用-1表示這是一個新添加操作
                setActiveCertIndex(-1);
                setEditing({
                  name: '',
                  dateAchieved: '',
                  expiredDate: ''
                });
                console.log('activeCertIndex set to -1 to indicate new item');
              }}
              className="mb-4"
              variant="outline"
              type="button"
            >
              <PlusCircle className="h-4 w-4 mr-2" />{t('resume-refine:certifications.addCertification')}
            </Button>
          )}
          
          {certificationsList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('resume-refine:certifications.certificationName')}</TableHead>
                  <TableHead>{t('resume-refine:certifications.dateAchieved')}</TableHead>
                  <TableHead>{t('resume-refine:certifications.expirationDate')}</TableHead>
                  <TableHead>{t('resume-refine:certifications.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificationsList.map((cert: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{cert.name}</TableCell>
                    <TableCell>{cert.dateAchieved}</TableCell>
                    <TableCell>{cert.expiredDate || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => initEditForm(idx)}
                          type="button"
                        >
                          {t('resume-refine:certifications.edit')}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveCertification(idx)}
                          type="button"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMoveCertification(idx, 'up')}
                          disabled={idx === 0}
                          type="button"
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMoveCertification(idx, 'down')}
                          disabled={idx === certificationsList.length - 1}
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
              {t('resume-refine:certifications.noCertifications')}
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {activeCertIndex >= 0 ? t('resume-refine:certifications.editCertification') : t('resume-refine:certifications.addCertification')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('resume-refine:certifications.name')}</Label>
              <Input 
                id="name" 
                value={editing.name} 
                onChange={(e) => handleEditingChange('name', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateAchieved">{t('resume-refine:certifications.dateAchievedInput')}</Label>
                <Input 
                  id="dateAchieved" 
                  value={editing.dateAchieved} 
                  onChange={(e) => handleEditingChange('dateAchieved', e.target.value)}
                  placeholder={t('resume-refine:certifications.dateAchievedPlaceholder')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expiredDate">{t('resume-refine:certifications.expirationDateInput')}</Label>
                <Input 
                  id="expiredDate" 
                  value={editing.expiredDate} 
                  onChange={(e) => handleEditingChange('expiredDate', e.target.value)}
                  placeholder={t('resume-refine:certifications.expirationDatePlaceholder')}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setActiveCertIndex(null)}
              type="button"
            >
              {t('resume-refine:certifications.cancel')}
            </Button>
            <Button 
              onClick={handleSaveCertification}
              type="button"
            >
              {t('resume-refine:certifications.saveCertification')}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default CertificationsSection;
