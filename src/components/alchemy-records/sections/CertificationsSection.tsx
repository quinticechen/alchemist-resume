
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusCircle, MinusCircle, MoveUp, MoveDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface CertificationsSectionProps {
  data: any;
  onChange: (updatedData: any) => void;
}

const CertificationsSection = ({ data, onChange }: CertificationsSectionProps) => {
  const [activeCertIndex, setActiveCertIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ [key: string]: string }>({});
  
  const certificationsList = data?.certifications || [];
  
  console.log('Certifications data:', certificationsList);
  
  const initEditForm = (idx: number | null) => {
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
  };
  
  const handleSaveCertification = () => {
    const updatedCertifications = [...certificationsList];
    
    const certItem = {
      ...editing
    };
    
    if (activeCertIndex !== null) {
      // Update existing item
      updatedCertifications[activeCertIndex] = certItem;
    } else {
      // Add new item
      updatedCertifications.push(certItem);
    }
    
    onChange({
      ...data,
      certifications: updatedCertifications
    });
    
    // Reset form
    setActiveCertIndex(null);
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

  return (
    <div className="space-y-4">
      {activeCertIndex === null && (
        <>
          <Button 
            onClick={() => initEditForm(null)} 
            className="mb-4" 
            variant="outline"
          >
            <PlusCircle className="h-4 w-4 mr-2" />Add Certification
          </Button>
          
          {certificationsList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certification Name</TableHead>
                  <TableHead>Date Achieved</TableHead>
                  <TableHead>Expiration Date</TableHead>
                  <TableHead>Actions</TableHead>
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
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveCertification(idx)}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMoveCertification(idx, 'up')}
                          disabled={idx === 0}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMoveCertification(idx, 'down')}
                          disabled={idx === certificationsList.length - 1}
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
              No certifications added yet. Click "Add Certification" to get started.
            </div>
          )}
        </>
      )}
      
      {activeCertIndex !== null && (
        <Card>
          <CardHeader>
            <CardTitle>
              {activeCertIndex === null ? 'Add Certification' : 'Edit Certification'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Certification Name</Label>
              <Input 
                id="name" 
                value={editing.name} 
                onChange={(e) => handleEditingChange('name', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateAchieved">Date Achieved (YYYY-MM)</Label>
                <Input 
                  id="dateAchieved" 
                  value={editing.dateAchieved} 
                  onChange={(e) => handleEditingChange('dateAchieved', e.target.value)}
                  placeholder="YYYY-MM"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expiredDate">Expiration Date (YYYY-MM)</Label>
                <Input 
                  id="expiredDate" 
                  value={editing.expiredDate} 
                  onChange={(e) => handleEditingChange('expiredDate', e.target.value)}
                  placeholder="YYYY-MM"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setActiveCertIndex(null)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCertification}
            >
              Save Certification
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default CertificationsSection;
