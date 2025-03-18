
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, FileText, Download } from "lucide-react";

interface ResumeEditorProps {
  resumeId: string;
  goldenResume: string | null;
  analysisId: string;
  onClose: () => void;
}

interface ResumeSection {
  id: string;
  title: string;
  content: string;
}

const initialSections: ResumeSection[] = [
  { id: 'header', title: 'Contact Information', content: 'FULL NAME\nPhone | Email | Location | LinkedIn' },
  { id: 'summary', title: 'Professional Summary', content: '[3-4 sentences highlighting key qualifications aligned with job requirements]' },
  { id: 'experience', title: 'Professional Experience', content: 'Company Name | Location\nJob Title | MM/YYYY - MM/YYYY\n• Achievement-focused bullet point with metrics\n• Achievement-focused bullet point with metrics\n• Achievement-focused bullet point with metrics' },
  { id: 'projects', title: 'Projects', content: 'Project Name | MM/YYYY - MM/YYYY\n• Achievement-focused bullet point with metrics\n• Achievement-focused bullet point with metrics' },
  { id: 'volunteer', title: 'Volunteer', content: 'Project Name | MM/YYYY - MM/YYYY\n• Achievement-focused bullet point with metrics' },
  { id: 'education', title: 'Education', content: 'Degree Name | Institution\nGraduation Date | GPA (if notable)' },
  { id: 'skills', title: 'Skills', content: '• Technical Skills: [List relevant skills]\n• Soft Skills: [List relevant skills]' },
  { id: 'certifications', title: 'Certifications & Licenses', content: '• Certification Name (Date achieved)\n• Licenses Name (Date achieved)' },
  { id: 'guidance', title: 'Optimization Guidance', content: '• Add specific metrics to showcase achievements\n• Focus on results rather than responsibilities' },
];

// Parse golden resume into sections
const parseGoldenResume = (goldenResume: string): ResumeSection[] => {
  if (!goldenResume) return initialSections;
  
  try {
    const sections = [...initialSections];
    
    // Simple parsing based on section titles in uppercase
    const potentialSections = [
      { id: 'header', title: 'CONTACT INFORMATION', regex: /CONTACT INFORMATION|FULL NAME/i },
      { id: 'summary', title: 'PROFESSIONAL SUMMARY', regex: /PROFESSIONAL SUMMARY|SUMMARY/i },
      { id: 'experience', title: 'PROFESSIONAL EXPERIENCE', regex: /PROFESSIONAL EXPERIENCE|EXPERIENCE|WORK EXPERIENCE/i },
      { id: 'projects', title: 'PROJECTS', regex: /PROJECTS/i },
      { id: 'volunteer', title: 'VOLUNTEER', regex: /VOLUNTEER/i },
      { id: 'education', title: 'EDUCATION', regex: /EDUCATION/i },
      { id: 'skills', title: 'SKILLS', regex: /SKILLS/i },
      { id: 'certifications', title: 'CERTIFICATIONS', regex: /CERTIFICATIONS|LICENSES/i },
    ];
    
    // Split the golden resume into lines
    const lines = goldenResume.split('\n');
    let currentSection: string | null = null;
    let currentContent: string[] = [];
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line is a section header
      const sectionMatch = potentialSections.find(section => 
        section.regex.test(line)
      );
      
      if (sectionMatch) {
        // If we were already collecting content for a section, save it
        if (currentSection) {
          const sectionToUpdate = sections.find(s => s.id === currentSection);
          if (sectionToUpdate) {
            sectionToUpdate.content = currentContent.join('\n');
          }
          currentContent = [];
        }
        
        // Start collecting content for the new section
        currentSection = sectionMatch.id;
      } else if (currentSection) {
        // Add this line to the current section's content
        currentContent.push(line);
      }
    }
    
    // Save the last section's content if there is any
    if (currentSection && currentContent.length > 0) {
      const sectionToUpdate = sections.find(s => s.id === currentSection);
      if (sectionToUpdate) {
        sectionToUpdate.content = currentContent.join('\n');
      }
    }
    
    return sections;
  } catch (error) {
    console.error('Error parsing golden resume:', error);
    return initialSections;
  }
};

const ResumeEditor: React.FC<ResumeEditorProps> = ({ resumeId, goldenResume, analysisId, onClose }) => {
  const [sections, setSections] = useState<ResumeSection[]>(() => {
    // Initialize with parsed golden resume if available
    return goldenResume ? parseGoldenResume(goldenResume) : initialSections;
  });
  const [activeTab, setActiveTab] = useState('header');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Try to load existing resume data if available
    const loadResumeData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('resume_editors')
          .select('*')
          .eq('analysis_id', analysisId)
          .single();
        
        if (error) {
          console.error('Error loading resume data:', error);
          // If no existing data, and we have a golden resume, parse it
          if (goldenResume) {
            const parsedSections = parseGoldenResume(goldenResume);
            setSections(parsedSections);
            console.log('Initialized with golden resume sections:', parsedSections);
          }
        } else if (data) {
          // We have existing data, so use it
          try {
            const parsedSections = JSON.parse(data.content);
            if (Array.isArray(parsedSections)) {
              setSections(parsedSections);
              console.log('Loaded saved sections from database:', parsedSections);
            }
          } catch (e) {
            console.error('Error parsing resume content:', e);
          }
          
          if (data.last_saved) {
            setLastSaved(new Date(data.last_saved));
          }
        }
      } catch (error) {
        console.error('Error in loadResumeData:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadResumeData();
    
    // Set up autosave
    const autosaveInterval = setInterval(() => {
      handleSave(true);
    }, 30000); // Autosave every 30 seconds
    
    return () => clearInterval(autosaveInterval);
  }, [analysisId, goldenResume]);
  
  const handleContentChange = (id: string, newContent: string) => {
    setSections(sections.map(section => 
      section.id === id ? { ...section, content: newContent } : section
    ));
  };
  
  const handleSave = async (isAutosave = false) => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('resume_editors')
        .upsert({
          analysis_id: analysisId,
          content: JSON.stringify(sections),
          last_saved: new Date().toISOString()
        }, {
          onConflict: 'analysis_id'
        });
      
      if (error) {
        console.error('Error saving resume data:', error);
        toast({
          title: "Save failed",
          description: "There was an error saving your resume. Please try again.",
          variant: "destructive"
        });
      } else {
        setLastSaved(new Date());
        if (!isAutosave) {
          toast({
            title: "Resume saved",
            description: "Your resume has been saved successfully."
          });
        }
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const generateFullResume = (): string => {
    return sections.map(section => {
      // Skip the guidance section in the full resume
      if (section.id === 'guidance') return '';
      
      return `${section.title.toUpperCase()}\n${section.content}\n\n`;
    }).join('');
  };
  
  const handleExport = () => {
    const fullResume = generateFullResume();
    const blob = new Blob([fullResume], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading resume data...</div>;
  }
  
  return (
    <div className="flex h-full flex-col md:flex-row gap-4">
      <div className="w-full md:w-1/3 overflow-y-auto border-r pr-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="h-full">
          <TabsList className="flex flex-col w-full h-auto">
            {sections.map(section => (
              <TabsTrigger 
                key={section.id} 
                value={section.id}
                className="justify-start w-full"
              >
                {section.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <div className="mt-4 space-y-2">
          <Button 
            onClick={() => handleSave()}
            disabled={isSaving}
            className="w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Resume'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleExport}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Export as Text
          </Button>
          
          {lastSaved && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Last saved: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
      
      <div className="w-full md:w-2/3 overflow-y-auto">
        <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
          {sections.map(section => (
            <TabsContent key={section.id} value={section.id} className="mt-0">
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                <Textarea
                  value={section.content}
                  onChange={(e) => handleContentChange(section.id, e.target.value)}
                  className="min-h-[300px] font-mono"
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default ResumeEditor;
