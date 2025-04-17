
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, MinusCircle, MoveUp, MoveDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectsSectionProps {
  data: any;
  onChange: (updatedData: any) => void;
  showAddForm?: boolean;
}

const ProjectsSection = ({ data, onChange, showAddForm = true }: ProjectsSectionProps) => {
  const [activeProjectIndex, setActiveProjectIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ [key: string]: string }>({});
  const [achievements, setAchievements] = useState<string[]>([]);
  
  const projectsList = data?.projects || [];
  
  const initEditForm = (idx: number | null) => {
    if (idx !== null && projectsList[idx]) {
      const project = projectsList[idx];
      setEditing({
        name: project.name || '',
        startDate: project.startDate || '',
        endDate: project.endDate || '',
      });
      setAchievements(project.achievements || []);
    } else {
      setEditing({
        name: '',
        startDate: '',
        endDate: '',
      });
      setAchievements([]);
    }
    setActiveProjectIndex(idx);
  };
  
  const handleSaveProject = () => {
    const updatedProjects = [...projectsList];
    
    const projectItem = {
      ...editing,
      achievements: achievements
    };
    
    if (activeProjectIndex !== null) {
      // Update existing item
      updatedProjects[activeProjectIndex] = projectItem;
    } else {
      // Add new item
      updatedProjects.push(projectItem);
    }
    
    onChange({
      ...data,
      projects: updatedProjects
    });
    
    // Reset form
    setActiveProjectIndex(null);
  };
  
  const handleRemoveProject = (idx: number) => {
    const updatedProjects = [...projectsList];
    updatedProjects.splice(idx, 1);
    
    onChange({
      ...data,
      projects: updatedProjects
    });
    
    if (activeProjectIndex === idx) {
      setActiveProjectIndex(null);
    }
  };
  
  const handleMoveProject = (idx: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && idx === 0) || 
        (direction === 'down' && idx === projectsList.length - 1)) {
      return;
    }
    
    const updatedProjects = [...projectsList];
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    
    [updatedProjects[idx], updatedProjects[newIdx]] = 
      [updatedProjects[newIdx], updatedProjects[idx]];
    
    onChange({
      ...data,
      projects: updatedProjects
    });
    
    if (activeProjectIndex === idx) {
      setActiveProjectIndex(newIdx);
    } else if (activeProjectIndex === newIdx) {
      setActiveProjectIndex(idx);
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
      {activeProjectIndex === null && (
        <>
          {showAddForm && (
            <Button 
              onClick={() => initEditForm(null)} 
              className="mb-4" 
              variant="outline"
            >
              <PlusCircle className="h-4 w-4 mr-2" />Add Project
            </Button>
          )}
          
          {projectsList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectsList.map((project: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>
                      {project.startDate} - {project.endDate || 'Present'}
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
                          onClick={() => handleRemoveProject(idx)}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMoveProject(idx, 'up')}
                          disabled={idx === 0}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMoveProject(idx, 'down')}
                          disabled={idx === projectsList.length - 1}
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
              No projects added yet. Click "Add Project" to get started.
            </div>
          )}
        </>
      )}
      
      {activeProjectIndex !== null && (
        <Card>
          <CardHeader>
            <CardTitle>
              {activeProjectIndex === null ? 'Add Project' : 'Edit Project'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
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
              onClick={() => setActiveProjectIndex(null)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProject}
            >
              Save Project
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default ProjectsSection;
