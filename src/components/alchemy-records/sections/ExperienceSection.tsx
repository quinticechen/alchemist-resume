import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, MinusCircle, MoveUp, MoveDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ExperienceSectionProps {
  data: any;
  onChange: (updatedData: any) => void;
  showAddForm?: boolean;
}

const ExperienceSection = ({ data, onChange, showAddForm = true }: ExperienceSectionProps) => {
  const [activeExpIndex, setActiveExpIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ [key: string]: string }>({
    companyName: '',
    location: '',
    jobTitle: '',
    startDate: '',
    endDate: '',
    companyIntroduction: '',
  });
  const [achievements, setAchievements] = useState<string[]>([]);
  
  const experienceList = data?.professionalExperience || [];
  
  console.log('Experience data:', experienceList);
  console.log('showAddForm prop:', showAddForm);
  
  // Initialize edit form with experience data or empty form
  const initEditForm = (idx: number | null) => {
    console.log('Initializing experience edit form with index:', idx);
    if (idx !== null && experienceList[idx]) {
      const exp = experienceList[idx];
      setEditing({
        companyName: exp.companyName || '',
        location: exp.location || '',
        jobTitle: exp.jobTitle || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        companyIntroduction: exp.companyIntroduction || '',
      });
      setAchievements(exp.achievements || []);
    } else {
      setEditing({
        companyName: '',
        location: '',
        jobTitle: '',
        startDate: '',
        endDate: '',
        companyIntroduction: '',
      });
      setAchievements([]);
    }
    setActiveExpIndex(idx);
    console.log('Active experience index set to:', idx);
  };
  
  const handleSaveExperience = () => {
    console.log('Save Experience button clicked');
    console.log('Current editing data:', editing);
    console.log('Current achievements:', achievements);
    console.log('Current activeExpIndex:', activeExpIndex);
    
    const updatedExperience = [...experienceList];
    
    const experienceItem = {
      ...editing,
      achievements: achievements
    };
    
    if (activeExpIndex !== null && activeExpIndex >= 0) {
      // Update existing item
      updatedExperience[activeExpIndex] = experienceItem;
    } else {
      // Add new item (activeExpIndex === null or activeExpIndex === -1)
      updatedExperience.push(experienceItem);
    }
    
    console.log('Updated experienceList before save:', updatedExperience);
    
    onChange({
      ...data,
      professionalExperience: updatedExperience
    });
    
    // Reset form
    setActiveExpIndex(null);
    console.log('Form reset, activeExpIndex set to null');
  };
  
  const handleRemoveExperience = (idx: number) => {
    const updatedExperience = [...experienceList];
    updatedExperience.splice(idx, 1);
    
    onChange({
      ...data,
      professionalExperience: updatedExperience
    });
    
    if (activeExpIndex === idx) {
      setActiveExpIndex(null);
    }
  };
  
  const handleMoveExperience = (idx: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && idx === 0) || 
        (direction === 'down' && idx === experienceList.length - 1)) {
      return;
    }
    
    const updatedExperience = [...experienceList];
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    
    [updatedExperience[idx], updatedExperience[newIdx]] = 
      [updatedExperience[newIdx], updatedExperience[idx]];
    
    onChange({
      ...data,
      professionalExperience: updatedExperience
    });
    
    if (activeExpIndex === idx) {
      setActiveExpIndex(newIdx);
    } else if (activeExpIndex === newIdx) {
      setActiveExpIndex(idx);
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

  const handleAddExperienceClick = () => {
    console.log('Add Experience button clicked');
    console.log('Current activeExpIndex before init:', activeExpIndex);
    console.log('Current experienceList:', experienceList);
    initEditForm(null);
    console.log('Updated activeExpIndex after init:', activeExpIndex);
  };

  return (
    <div className="space-y-4">
      {activeExpIndex === null ? (
        <>
          {showAddForm && (
            <Button 
              onClick={() => {
                console.log('Direct button click handler');
                setActiveExpIndex(-1);
                setEditing({
                  companyName: '',
                  location: '',
                  jobTitle: '',
                  startDate: '',
                  endDate: '',
                  companyIntroduction: '',
                });
                setAchievements([]);
                console.log('activeExpIndex set to -1 to indicate new item');
              }}
              className="mb-4" 
              variant="outline"
              type="button"
            >
              <PlusCircle className="h-4 w-4 mr-2" />Add Experience
            </Button>
          )}
          
          {experienceList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experienceList.map((exp: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{exp.jobTitle}</TableCell>
                    <TableCell>{exp.companyName}</TableCell>
                    <TableCell>
                      {exp.startDate} - {exp.endDate || 'Present'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => initEditForm(idx)}
                          type="button"
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveExperience(idx)}
                          type="button"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMoveExperience(idx, 'up')}
                          disabled={idx === 0}
                          type="button"
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMoveExperience(idx, 'down')}
                          disabled={idx === experienceList.length - 1}
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
              No experience entries yet. Click "Add Experience" to get started.
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {activeExpIndex >= 0 ? 'Edit Experience' : 'Add Experience'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input 
                  id="jobTitle" 
                  value={editing.jobTitle} 
                  onChange={(e) => handleEditingChange('jobTitle', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company</Label>
                <Input 
                  id="companyName" 
                  value={editing.companyName} 
                  onChange={(e) => handleEditingChange('companyName', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location" 
                value={editing.location} 
                onChange={(e) => handleEditingChange('location', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyIntroduction">Company Introduction</Label>
              <Textarea 
                id="companyIntroduction"
                value={editing.companyIntroduction} 
                onChange={(e) => handleEditingChange('companyIntroduction', e.target.value)}
                placeholder="Briefly describe the company..."
                className="min-h-[100px]"
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
                  type="button"
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
                        type="button"
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
              onClick={() => setActiveExpIndex(null)}
              type="button"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveExperience}
              type="button"
            >
              Save Experience
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default ExperienceSection;
