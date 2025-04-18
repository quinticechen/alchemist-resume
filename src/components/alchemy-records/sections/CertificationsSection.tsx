
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface CertificationsSectionProps {
  data: any;
  onChange: (updatedData: any) => void;
  showAddForm?: boolean;
}

const CertificationsSection = ({ data, onChange, showAddForm = true }: CertificationsSectionProps) => {
  const [activeCertIndex, setActiveCertIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ [key: string]: string }>({
    name: '',
    dateAchieved: '',
    expiredDate: '',
  });
  
  const certificationsList = Array.isArray(data?.certifications) ? data.certifications : [];
  
  const initEditForm = (idx: number | null) => {
    if (idx !== null && idx >= 0 && certificationsList[idx]) {
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
    
    if (activeCertIndex !== null && activeCertIndex >= 0) {
      // Update existing item
      updatedCertifications[activeCertIndex] = editing;
    } else {
      // Add new item
      updatedCertifications.push(editing);
    }
    
    // Check if we're dealing with the nested structure
    if (data?.resume?.certifications) {
      onChange({
        ...data,
        resume: {
          ...data.resume,
          certifications: updatedCertifications
        }
      });
    } else {
      onChange({
        ...data,
        certifications: updatedCertifications
      });
    }
    
    // Reset form
    setActiveCertIndex(null);
    setEditing({
      name: '',
      dateAchieved: '',
      expiredDate: '',
    });
  };

  const handleDeleteCertification = (index: number) => {
    const updatedCertifications = [...certificationsList];
    updatedCertifications.splice(index, 1);
    
    // Check if we're dealing with the nested structure
    if (data?.resume?.certifications) {
      onChange({
        ...data,
        resume: {
          ...data.resume,
          certifications: updatedCertifications
        }
      });
    } else {
      onChange({
        ...data,
        certifications: updatedCertifications
      });
    }
  };

  const handleEditCertification = (index: number) => {
    initEditForm(index);
  };

  return (
    <div className="space-y-4">
      {activeCertIndex !== null ? (
        <div className="border p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">
            {activeCertIndex >= 0 ? "Edit Certification" : "Add Certification"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <Label htmlFor="name">Certification Name</Label>
              <Input
                id="name"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="e.g., AWS Certified Solutions Architect"
              />
            </div>
            <div>
              <Label htmlFor="dateAchieved">Date Achieved</Label>
              <Input
                id="dateAchieved"
                value={editing.dateAchieved}
                onChange={(e) => setEditing({ ...editing, dateAchieved: e.target.value })}
                placeholder="e.g., 2023-04"
              />
            </div>
            <div>
              <Label htmlFor="expiredDate">Expiration Date</Label>
              <Input
                id="expiredDate"
                value={editing.expiredDate}
                onChange={(e) => setEditing({ ...editing, expiredDate: e.target.value })}
                placeholder="e.g., 2026-04 or leave blank if none"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setActiveCertIndex(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCertification}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          {certificationsList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certification Name</TableHead>
                  <TableHead>Date Achieved</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificationsList.map((cert: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{cert.name}</TableCell>
                    <TableCell>{cert.dateAchieved}</TableCell>
                    <TableCell>{cert.expiredDate || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditCertification(index)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteCertification(index)}
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
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-md">
              <p className="text-gray-500">No certifications added yet.</p>
            </div>
          )}
          
          {showAddForm && (
            <div className="text-center mt-4">
              <Button
                variant="outline"
                onClick={() => initEditForm(-1)}
                className="flex items-center mx-auto"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Certification
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CertificationsSection;
