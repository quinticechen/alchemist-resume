
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SkillsSectionProps {
  data: any;
  onChange: (updatedData: any) => void;
  showAddForm?: boolean;
}

const SkillsSection = ({ data, onChange, showAddForm = true }: SkillsSectionProps) => {
  const [newTechnicalSkill, setNewTechnicalSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');
  
  const skills = data?.skills || { technical: [], soft: [] };
  
  const handleAddTechnicalSkill = () => {
    if (!newTechnicalSkill.trim()) return;
    
    const updatedSkills = {
      ...skills,
      technical: [...(skills.technical || []), newTechnicalSkill.trim()]
    };
    
    onChange({
      ...data,
      skills: updatedSkills
    });
    
    setNewTechnicalSkill('');
  };
  
  const handleAddSoftSkill = () => {
    if (!newSoftSkill.trim()) return;
    
    const updatedSkills = {
      ...skills,
      soft: [...(skills.soft || []), newSoftSkill.trim()]
    };
    
    onChange({
      ...data,
      skills: updatedSkills
    });
    
    setNewSoftSkill('');
  };
  
  const handleRemoveTechnicalSkill = (idx: number) => {
    const updatedTechnical = [...(skills.technical || [])];
    updatedTechnical.splice(idx, 1);
    
    const updatedSkills = {
      ...skills,
      technical: updatedTechnical
    };
    
    onChange({
      ...data,
      skills: updatedSkills
    });
  };
  
  const handleRemoveSoftSkill = (idx: number) => {
    const updatedSoft = [...(skills.soft || [])];
    updatedSoft.splice(idx, 1);
    
    const updatedSkills = {
      ...skills,
      soft: updatedSoft
    };
    
    onChange({
      ...data,
      skills: updatedSkills
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Technical Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(skills.technical || []).map((skill: string, idx: number) => (
              <div 
                key={idx} 
                className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full flex items-center"
              >
                {skill}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-1 h-5 w-5 p-0" 
                  onClick={() => handleRemoveTechnicalSkill(idx)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            
            {(skills.technical || []).length === 0 && (
              <div className="text-gray-500 italic">No technical skills added yet</div>
            )}
          </div>
          
          {showAddForm && (
            <div className="flex space-x-2">
              <Input 
                value={newTechnicalSkill} 
                onChange={(e) => setNewTechnicalSkill(e.target.value)}
                placeholder="Add a technical skill..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTechnicalSkill();
                  }
                }}
              />
              <Button 
                onClick={handleAddTechnicalSkill}
                disabled={!newTechnicalSkill.trim()}
              >
                <PlusCircle className="h-4 w-4 mr-2" />Add
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Soft Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(skills.soft || []).map((skill: string, idx: number) => (
              <div 
                key={idx} 
                className="bg-green-50 text-green-800 px-3 py-1 rounded-full flex items-center"
              >
                {skill}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-1 h-5 w-5 p-0" 
                  onClick={() => handleRemoveSoftSkill(idx)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            
            {(skills.soft || []).length === 0 && (
              <div className="text-gray-500 italic">No soft skills added yet</div>
            )}
          </div>
          
          {showAddForm && (
            <div className="flex space-x-2">
              <Input 
                value={newSoftSkill} 
                onChange={(e) => setNewSoftSkill(e.target.value)}
                placeholder="Add a soft skill..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSoftSkill();
                  }
                }}
              />
              <Button 
                onClick={handleAddSoftSkill}
                disabled={!newSoftSkill.trim()}
              >
                <PlusCircle className="h-4 w-4 mr-2" />Add
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SkillsSection;
