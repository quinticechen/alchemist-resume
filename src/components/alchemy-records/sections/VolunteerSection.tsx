
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, MinusCircle, MoveUp, MoveDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface VolunteerSectionProps {
  data: any;
  onChange: (updatedData: any) => void;
  showAddForm?: boolean;
}

const VolunteerSection = ({ data, onChange, showAddForm = true }: VolunteerSectionProps) => {
  const [activeVolunteerIndex, setActiveVolunteerIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ [key: string]: string }>({});
  const [achievements, setAchievements] = useState<string[]>([]);
  
  const volunteerList = data?.volunteer || [];
  
  const initEditForm = (idx: number | null) => {
    if (idx !== null && volunteerList[idx]) {
      const volunteer = volunteerList[idx];
      setEditing({
        name: volunteer.name || '',
        startDate: volunteer.startDate || '',
        endDate: volunteer.endDate || '',
      });
      setAchievements(volunteer.achievements || []);
    } else {
      setEditing({
        name: '',
        startDate: '',
        endDate: '',
      });
      setAchievements([]);
    }
    setActiveVolunteerIndex(idx);
  };
  
  const handleSaveVolunteer = () => {
    const updatedVolunteer = [...volunteerList];
    
    const volunteerItem = {
      ...editing,
      achievements: achievements
    };
    
    if (activeVolunteerIndex !== null) {
      // Update existing item
      updatedVolunteer[activeVolunteerIndex] = volunteerItem;
    } else {
      // Add new item
      updatedVolunteer.push(volunteerItem);
    }
    
    onChange({
      ...data,
      volunteer: updatedVolunteer
    });
    
    // Reset form
    setActiveVolunteerIndex(null);
  };
  
  const handleRemoveVolunteer = (idx: number) => {
    const updatedVolunteer = [...volunteerList];
    updatedVolunteer.splice(idx, 1);
    
    onChange({
      ...data,
      volunteer: updatedVolunteer
    });
    
    if (activeVolunteerIndex === idx) {
      setActiveVolunteerIndex(null);
    }
  };
  
  const handleMoveVolunteer = (idx: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && idx === 0) || 
        (direction === 'down' && idx === volunteerList.length - 1)) {
      return;
    }
    
    const updatedVolunteer = [...volunteerList];
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    
    [updatedVolunteer[idx], updatedVolunteer[newIdx]] = 
      [updatedVolunteer[newIdx], updatedVolunteer[idx]];
    
    onChange({
      ...data,
      volunteer: updatedVolunteer
    });
    
    if (activeVolunteerIndex === idx) {
      setActiveVolunteerIndex(newIdx);
    } else if (activeVolunteerIndex === newIdx) {
      setActiveVolunteerIndex(idx);
    }
  };
  
  const handleAddAchievement = () => {
    setAchievements([...achievements, '']);
  };
  
  const handleUpdateAchievement = (idx: number, value: string) => {
    const updatedAchievements = [...achievements];
    updatedAchievements[idx] = value;
    setAchievements(updatedAchievements);
  };
  
  const handleRemoveAchievement = (idx: number) => {
    const updatedAchievements = [...achievements];
    updatedAchievements.splice(idx, 1);
    setAchievements(updatedAchievements);
  };
  
  const handleEditingChange = (field: string, value: string) => {
    setEditing({
      ...editing,
      [field]: value
    });
  };

  return (
    <div className="space-y-4">
      {activeVolunteerIndex === null && (
        <>
          {showAddForm && (
            <Button 
              onClick={() => initEditForm(null)} 
              className="mb-4" 
              variant="outline"
            >
              <PlusCircle className="h-4 w-4 mr-2" />Add Volunteer Experience
            </Button>
          )}
          
          {volunteerList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {volunteerList.map((volunteer: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{volunteer.name}</TableCell>
                    <TableCell>
                      {volunteer.startDate} - {volunteer.endDate || 'Present'}
                    </TableCell>
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
                          onClick={() => handleRemoveVolunteer(idx)}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMoveVolunteer(idx, 'up')}
                          disabled={idx === 0}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMoveVolunteer(idx, 'down')}
                          disabled={idx === volunteerList.length - 1}
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
              No volunteer experience added yet. Click "Add Volunteer Experience" to get started.
            </div>
          )}
        </>
      )}
      
      {activeVolunteerIndex !== null && (
        <Card>
          <CardHeader>
            <CardTitle>
              {activeVolunteerIndex === null ? 'Add Volunteer Experience' : 'Edit Volunteer Experience'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input 
                id="name" 
                value={editing.name} 
                onChange={(e) => handleEditingChange('name', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date (YYYY-MM)</Label>
                <Input 
                  id="startDate" 
                  value={editing.startDate} 
                  onChange={(e) => handleEditingChange('startDate', e.target.value)}
                  placeholder="YYYY-MM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (YYYY-MM or blank for current)</Label>
                <Input 
                  id="endDate" 
                  value={editing.endDate} 
                  onChange={(e) => handleEditingChange('endDate', e.target.value)}
                  placeholder="YYYY-MM"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Achievements</Label>
                <Button 
                  onClick={handleAddAchievement} 
                  variant="outline" 
                  size="sm"
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              
              {achievements.length > 0 ? (
                <div className="space-y-2">
                  {achievements.map((achievement, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <Textarea 
                        value={achievement}
                        onChange={(e) => handleUpdateAchievement(idx, e.target.value)}
                        className="flex-1"
                        placeholder="Describe your achievement..."
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveAchievement(idx)}
                        className="mt-2"
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-md">
                  No achievements added. Click "Add" to include achievements.
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setActiveVolunteerIndex(null)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveVolunteer}
            >
              Save Volunteer Experience
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default VolunteerSection;
