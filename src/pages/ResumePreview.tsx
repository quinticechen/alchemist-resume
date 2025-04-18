import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, FileText, Download, Edit, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ResumeSection, getFormattedResume } from '@/utils/resumeUtils';
import Lottie from 'lottie-react';
import loadingAnimation from '@/animations/Loading.json';
import { ResumeData, ResumeAnalysis, Resume, Experience, Education, Project, Volunteer, Certification, PersonalInfo, Skills } from '@/types/resume';
import SeekerChatSheet from "@/components/seeker/SeekerChatSheet";
import { useSeekerDialog } from "@/hooks/use-seeker-dialog";
import SeekerAnimation from "@/components/SeekerAnimation";

const RESUME_STYLES = [
  { id: 'classic', name: 'Classic', color: 'bg-white' },
  { id: 'modern', name: 'Modern', color: 'bg-blue-50' },
  { id: 'minimal', name: 'Minimal', color: 'bg-gray-50' },
  { id: 'professional', name: 'Professional', color: 'bg-amber-50' },
  { id: 'creative', name: 'Creative', color: 'bg-purple-50' },
];

interface JobData {
  job_title?: string;
  company_name?: string | null;
  company_url?: string | null;
  job_url?: string | null;
}

interface EditorContent {
  resume?: {
    personalInfo?: PersonalInfo;
    professionalSummary?: string;
    professionalExperience?: Experience[];
    education?: Education[];
    skills?: Skills;
    projects?: Project[];
    volunteer?: Volunteer[];
    certifications?: Certification[];
  };
  sectionOrder?: ResumeSection[];
}

const LOCAL_STORAGE_STYLE_KEY = 'resumePreviewStyle';

const isSectionEmpty = (data: ResumeData | null, section: string): boolean => {
  if (!data || !data.resume) return true;
  
  const sectionMapping: Record<string, string[]> = {
    'personalInfo': ['personalInfo'],
    'professionalSummary': ['summary', 'professionalSummary'],
    'professionalExperience': ['professionalExperience', 'experience'],
    'education': ['education'],
    'skills': ['skills'],
    'projects': ['projects'],
    'volunteer': ['volunteer'],
    'certifications': ['certifications']
  };
  
  const possibleKeys = sectionMapping[section] || [section];
  
  for (const key of possibleKeys) {
    const sectionData = data.resume[key];
    
    if (key === 'personalInfo') {
      if (sectionData && Object.keys(sectionData).length > 0) return false;
    } else if (key === 'summary' || key === 'professionalSummary') {
      if (sectionData && sectionData.trim() !== '') return false;
    } else if (Array.isArray(sectionData)) {
      if (sectionData && sectionData.length > 0) return false;
    } else if (sectionData) {
      return false;
    }
  }
  
  return true;
};

const DEFAULT_SECTION_ORDER: ResumeSection[] = [
  'personalInfo',
  'professionalSummary',
  'professionalExperience',
  'education',
  'skills',
  'projects',
  'volunteer',
  'certifications'
];

// Process resume data format
const prepareResumeData = (content: unknown): ResumeData => {
  try {
    console.log('Processing raw data:', content);
    
    // If content is a string, try to parse as JSON
    const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
    
    // Use getFormattedResume to format the data
    const formattedContent = getFormattedResume(parsedContent);
    console.log('Formatted data:', formattedContent);
    
    // Ensure data has the correct structure
    const result: ResumeData = {
      resume: {
        personalInfo: formattedContent.resume?.personalInfo || {
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          location: '',
          linkedIn: ''
        },
        professionalSummary: formattedContent.resume?.professionalSummary || '',
        professionalExperience: formattedContent.resume?.professionalExperience || [],
        projects: formattedContent.resume?.projects || [],
        volunteer: formattedContent.resume?.volunteer || [],
        education: formattedContent.resume?.education || [],
        skills: formattedContent.resume?.skills || { technical: [], soft: [] },
        certifications: formattedContent.resume?.certifications || [],
        guidanceForOptimization: formattedContent.resume?.guidanceForOptimization || []
      },
      sectionOrder: formattedContent.sectionOrder || DEFAULT_SECTION_ORDER,
      jobTitle: formattedContent.jobTitle || 'My Resume'
    };
    
    console.log('Final processed data:', result);
    return result;
  } catch (error) {
    console.error('Error preparing resume data:', error);
    // Return a default data structure
    return {
      resume: {
        personalInfo: {
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          location: '',
          linkedIn: ''
        },
        professionalSummary: '',
        professionalExperience: [],
        projects: [],
        volunteer: [],
        education: [],
        skills: { technical: [], soft: [] },
        certifications: [],
        guidanceForOptimization: []
      },
      sectionOrder: DEFAULT_SECTION_ORDER,
      jobTitle: 'My Resume'
    };
  }
};

const ResumePreview = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [jobTitle, setJobTitle] = useState<string>('My Resume');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [style, setStyle] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_STYLE_KEY) || 'classic';
  });
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);
  const locationState = location.state || {};
  const paramAnalysisId = params.analysisId;
  const { analysisId: locationAnalysisId } = locationState;
  
  const analysisId = paramAnalysisId || locationAnalysisId;
  const [isChatOpen, setIsChatOpen] = useState(false);
  const {
    chats,
    inputValue,
    isLoading: isChatLoading,
    isRetrying,
    apiError,
    currentThreadId,
    messagesEndRef,
    setInputValue,
    handleKeyDown,
    handleSendMessage: handleSend,
    handleGenerateSuggestion,
    handleRetry,
    handleApplySuggestion
  } = useSeekerDialog({
    currentSectionId: 'resume',
    jobData: resumeData
  });

  useEffect(() => {
    if (!isLoading && !session && !analysisId) {
      navigate('/login', { state: { from: '/resume-preview' } });
      return;
    }

    if (!analysisId) {
      navigate('/alchemy-records');
      return;
    }

    const fetchEditorContent = async () => {
      if (!analysisId) {
        setError("No analysis ID provided");
        return;
      }

      setLoading(true);
      try {
        // Get editor content
        const { data: editorData, error: editorError } = await supabase
          .from('resume_editors')
          .select('content')
          .eq('analysis_id', analysisId)
          .single();

        if (editorError) {
          throw editorError;
        }

        if (!editorData || !editorData.content) {
          setError("No resume content found");
          setLoading(false);
          return;
        }

        // Get analysis data and job title
        const { data: analysisData, error: analysisError } = await supabase
          .from('resume_analyses')
          .select(`
            *,
            job:job_id (
              job_title
            )
          `)
          .eq('id', analysisId)
          .single();

        if (analysisError) {
          throw analysisError;
        }

        // Set job title
        if (analysisData?.job?.job_title) {
          setJobTitle(analysisData.job.job_title);
        }

        // Process data
        const content = editorData.content;
        console.log('From Supabase retrieved raw content data:', content);
        
        // Convert data format
        const preparedData = prepareResumeData(content);
        console.log('Processed resume data:', preparedData);
        setResumeData(preparedData);
        setResumeAnalysis(analysisData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load resume data:', error);
        setError("Failed to load resume data");
        setLoading(false);
      }
    };

    fetchEditorContent();
  }, [session, isLoading, navigate, analysisId, toast]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_STYLE_KEY, style);
  }, [style]);

  const handleEditSection = (section: ResumeSection) => {
    navigate(`/resume-refine/${analysisId}`, { 
      state: { 
        analysisId,
        section 
      } 
    });
  };

  const handleEditClick = () => {
    if (!session) {
      toast({
        title: "Login Required",
        description: "You need to log in to edit this resume",
        variant: "destructive"
      });
      navigate('/login', { 
        state: { 
          from: `/resume-refine/${analysisId}` 
        } 
      });
      return;
    }
    
    navigate(`/resume-refine/${analysisId}`, { 
      state: { analysisId } 
    });
  };

  const handleExportPDF = async () => {
    if (!resumeRef.current) return;

    try {
      toast({ 
        title: "Preparing PDF", 
        description: "Your resume is being converted to PDF...", 
      });

      const resumeElement = resumeRef.current;
      
      const bgColor = style === 'classic' ? '#ffffff' : 
        style === 'modern' ? '#EFF6FF' : 
        style === 'minimal' ? '#F9FAFB' : 
        style === 'professional' ? '#FFFBEB' : 
        style === 'creative' ? '#F5F3FF' : '#ffffff';
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const canvas = await html2canvas(resumeElement, {
        scale: 3,
        useCORS: true,
        backgroundColor: bgColor,
        logging: false,
        allowTaint: true,
        foreignObjectRendering: false,
      });
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / pageWidth;
      
      const totalPages = Math.ceil(canvasHeight / (pageHeight * ratio));
      
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        
        const srcY = page * pageHeight * ratio;
        const srcHeight = Math.min(pageHeight * ratio, canvasHeight - srcY);
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasWidth;
        tempCanvas.height = srcHeight;
        
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          ctx.drawImage(
            canvas,
            0, srcY, canvasWidth, srcHeight,
            0, 0, canvasWidth, srcHeight
          );
          
          const imgData = tempCanvas.toDataURL('image/jpeg', 1.0);
          pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, (srcHeight / ratio));
        }
      }
      
      const fileName = resumeData?.jobTitle 
        ? `Resume_${resumeData.jobTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf` 
        : 'Resume.pdf';
      
      pdf.save(fileName);
      
      toast({ 
        title: "PDF Exported", 
        description: "Your resume has been successfully downloaded", 
        variant: "default" 
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({ 
        title: "Export Failed", 
        description: "Failed to export resume to PDF. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  if (isLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[50vh]">
        <Lottie 
          animationData={loadingAnimation} 
          className="w-32 h-32"
          loop={true}
        />
      </div>
    );
  }

  if (!resumeData) {
    return <div className="container mx-auto px-4 py-8">No resume data available</div>;
  }

  // Debug log
  console.log('Final rendered resumeData:', resumeData);
  console.log('personalInfo:', resumeData.resume?.personalInfo);
  console.log('professionalExperience:', resumeData.resume?.professionalExperience);
  console.log('education:', resumeData.resume?.education);
  console.log('skills:', resumeData.resume?.skills);

  const personalInfo = resumeData.resume?.personalInfo || {} as PersonalInfo;
  const experiences = resumeData.resume?.professionalExperience || [];
  const firstName = personalInfo.firstName || 'John';
  const lastName = personalInfo.lastName || 'Smith';
  const email = personalInfo.email || 'email@example.com';
  const phone = personalInfo.phone || '(123) 456-7890';

  const latestExperience = experiences && experiences.length > 0 ? experiences[0] : {
    jobTitle: 'Software Developer',
    companyName: 'Tech Company',
    startDate: '2020',
    endDate: 'Present'
  };

  const orderedSections = resumeData.sectionOrder || DEFAULT_SECTION_ORDER;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center mb-6 text-center">
            <h1 className="text-3xl font-bold bg-gradient-primary text-transparent bg-clip-text mb-4">
              {jobTitle}
            </h1>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={handleEditClick}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit Resume
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setStyleDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Change Style
              </Button>

              <Button 
                variant="outline" 
                onClick={handleExportPDF}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>

          <div 
            ref={resumeRef}
            className={`bg-white rounded-xl p-8 shadow-apple relative ${
              style === 'modern' ? 'bg-blue-50' : 
              style === 'minimal' ? 'bg-gray-50' : 
              style === 'professional' ? 'bg-amber-50' : 
              style === 'creative' ? 'bg-purple-50' : 'bg-white'
            }`}
          >
            <div className={`mb-6 pb-4 relative group ${style === 'modern' ? 'border-b-2 border-blue-300' : 
              style === 'minimal' ? 'border-b border-gray-200' : 
              style === 'professional' ? 'border-b-2 border-amber-300' : 
              style === 'creative' ? 'border-b-2 border-purple-300' : 'border-b-2 border-neutral-200'}`}>
              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full h-8 w-8 p-0"
                  onClick={() => handleEditSection('personalInfo')}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <h1 className={`text-3xl font-bold mb-2 ${
                style === 'modern' ? 'text-blue-700' : 
                style === 'professional' ? 'text-amber-700' : 
                style === 'creative' ? 'text-purple-700' : 'text-gray-800'
              }`}>
                {resumeData.resume?.personalInfo?.firstName} {resumeData.resume?.personalInfo?.lastName}
              </h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                {resumeData.resume?.personalInfo?.email && (
                  <span>{resumeData.resume.personalInfo.email}</span>
                )}
                {resumeData.resume?.personalInfo?.phone && (
                  <span>• {resumeData.resume.personalInfo.phone}</span>
                )}
                {resumeData.resume?.personalInfo?.location && (
                  <span>• {resumeData.resume.personalInfo.location}</span>
                )}
                {resumeData.resume?.personalInfo?.linkedIn && (
                  <span>• {resumeData.resume.personalInfo.linkedIn}</span>
                )}
              </div>
            </div>

            {orderedSections.map((sectionKey) => {
              if (sectionKey === 'personalInfo') return null;
              
              if (sectionKey === 'professionalSummary') {
                const summaryText = resumeData.resume?.summary || resumeData.resume?.professionalSummary || '';
                
                if (summaryText && summaryText.trim() !== '') {
                  return (
                    <div key={sectionKey} className="mb-6 relative group">
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-full h-8 w-8 p-0"
                          onClick={() => handleEditSection('professionalSummary')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <h2 className={`text-xl font-bold mb-2 ${
                        style === 'modern' ? 'text-blue-600' : 
                        style === 'professional' ? 'text-amber-600' : 
                        style === 'creative' ? 'text-purple-600' : 'text-gray-800'
                      }`}>
                        Professional Summary
                      </h2>
                      <p className="text-gray-700">{summaryText}</p>
                    </div>
                  );
                }
                return null;
              }
              
              if (sectionKey === 'professionalExperience' && resumeData.resume?.professionalExperience?.length > 0) {
                return (
                  <div key={sectionKey} className="mb-6 relative group">
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full h-8 w-8 p-0"
                        onClick={() => handleEditSection('professionalExperience')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <h2 className={`text-xl font-bold mb-2 ${
                      style === 'modern' ? 'text-blue-600' : 
                      style === 'professional' ? 'text-amber-600' : 
                      style === 'creative' ? 'text-purple-600' : 'text-gray-800'
                    }`}>
                      Professional Experience
                    </h2>
                    {resumeData.resume.professionalExperience.map((exp: Experience, index: number) => (
                      <div key={index} className="mb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-gray-800">{exp.jobTitle}</h3>
                            <p className="text-gray-600">{exp.companyName}{exp.location ? `, ${exp.location}` : ''}</p>
                          </div>
                          <p className="text-gray-500 text-sm">
                            {exp.startDate} - {exp.endDate || 'Present'}
                          </p>
                        </div>
                        {exp.companyIntroduction && (
                          <p className="text-sm text-gray-600 mt-1 italic">{exp.companyIntroduction}</p>
                        )}
                        {exp.achievements && (
                          <ul className="list-disc ml-5 mt-2 text-gray-700">
                            {exp.achievements.map((achievement: string, i: number) => (
                              <li key={i}>{achievement}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                );
              }
              
              if (sectionKey === 'education' && resumeData.resume?.education?.length > 0) {
                return (
                  <div key={sectionKey} className="mb-6 relative group">
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full h-8 w-8 p-0"
                        onClick={() => handleEditSection('education')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <h2 className={`text-xl font-bold mb-4 ${
                      style === 'modern' ? 'text-blue-600' : 
                      style === 'professional' ? 'text-amber-600' : 
                      style === 'creative' ? 'text-purple-600' : 'text-gray-800'
                    }`}>
                      Education
                    </h2>
                    {resumeData.resume.education.map((edu: Education, index: number) => (
                      <div key={index} className="mb-4 last:mb-0">
                        <h3 className="font-bold text-gray-800">{edu.degreeName}</h3>
                        <p className="text-gray-600">{edu.institution}</p>
                        {edu.enrollmentDate && edu.graduationDate ? (
                          <p className="text-gray-500">{edu.enrollmentDate} - {edu.graduationDate}</p>
                        ) : (
                          <p className="text-gray-500">Graduated: {edu.graduationDate}</p>
                        )}
                        {edu.gpa && <p className="text-gray-500">GPA: {edu.gpa}</p>}
                      </div>
                    ))}
                  </div>
                );
              }
              
              if (sectionKey === 'skills' && resumeData.resume?.skills) {
                return (
                  <div key={sectionKey} className="mb-6 relative group">
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full h-8 w-8 p-0"
                        onClick={() => handleEditSection('skills')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <h2 className={`text-xl font-bold mb-2 ${
                      style === 'modern' ? 'text-blue-600' : 
                      style === 'professional' ? 'text-amber-600' : 
                      style === 'creative' ? 'text-purple-600' : 'text-gray-800'
                    }`}>
                      Skills
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {resumeData.resume.skills.technical && resumeData.resume.skills.technical.length > 0 && (
                        <div>
                          <h3 className="font-bold text-gray-700 mb-1">Technical Skills</h3>
                          <ul className="list-disc ml-5 text-gray-700">
                            {resumeData.resume.skills.technical.map((skill: string, i: number) => (
                              <li key={i}>{skill}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {resumeData.resume.skills.soft && resumeData.resume.skills.soft.length > 0 && (
                        <div>
                          <h3 className="font-bold text-gray-700 mb-1">Soft Skills</h3>
                          <ul className="list-disc ml-5 text-gray-700">
                            {resumeData.resume.skills.soft.map((skill: string, i: number) => (
                              <li key={i}>{skill}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              
              if (sectionKey === 'projects' && resumeData.resume?.projects?.length > 0) {
                return (
                  <div key={sectionKey} className="mb-6 relative group">
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full h-8 w-8 p-0"
                        onClick={() => handleEditSection('projects')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <h2 className={`text-xl font-bold mb-2 ${
                      style === 'modern' ? 'text-blue-600' : 
                      style === 'professional' ? 'text-amber-600' : 
                      style === 'creative' ? 'text-purple-600' : 'text-gray-800'
                    }`}>
                      Projects
                    </h2>
                    {resumeData.resume.projects.map((project: Project, index: number) => (
                      <div key={index} className="mb-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-gray-800">{project.name}</h3>
                          {project.startDate && (
                            <p className="text-gray-500 text-sm">
                              {project.startDate} - {project.endDate || 'Present'}
                            </p>
                          )}
                        </div>
                        {project.achievements && (
                          <ul className="list-disc ml-5 mt-2 text-gray-700">
                            {project.achievements.map((achievement: string, i: number) => (
                              <li key={i}>{achievement}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                );
              }
              
              if (sectionKey === 'certifications' && resumeData.resume?.certifications?.length > 0) {
                return (
                  <div key={sectionKey} className="mb-6 relative group">
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full h-8 w-8 p-0"
                        onClick={() => handleEditSection('certifications')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <h2 className={`text-xl font-bold mb-2 ${
                      style === 'modern' ? 'text-blue-600' : 
                      style === 'professional' ? 'text-amber-600' : 
                      style === 'creative' ? 'text-purple-600' : 'text-gray-800'
                    }`}>
                      Certifications
                    </h2>
                    <ul className="list-disc ml-5 text-gray-700">
                      {resumeData.resume.certifications.map((cert: Certification, i: number) => (
                        <li key={i}>
                          {cert.name} 
                          {cert.dateAchieved && <span className="text-gray-500"> (Achieved: {cert.dateAchieved}</span>}
                          {cert.expiredDate && <span className="text-gray-500">, Expires: {cert.expiredDate}</span>}
                          {cert.dateAchieved && <span className="text-gray-500">)</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
              
              if (sectionKey === 'volunteer' && resumeData.resume?.volunteer?.length > 0) {
                return (
                  <div key={sectionKey} className="mb-6 relative group">
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full h-8 w-8 p-0"
                        onClick={() => handleEditSection('volunteer')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <h2 className={`text-xl font-bold mb-2 ${
                      style === 'modern' ? 'text-blue-600' : 
                      style === 'professional' ? 'text-amber-600' : 
                      style === 'creative' ? 'text-purple-600' : 'text-gray-800'
                    }`}>
                      Volunteer Experience
                    </h2>
                    {resumeData.resume.volunteer.map((vol: Volunteer, index: number) => (
                      <div key={index} className="mb-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-gray-800">{vol.name}</h3>
                          {vol.startDate && (
                            <p className="text-gray-500 text-sm">
                              {vol.startDate} - {vol.endDate || 'Present'}
                            </p>
                          )}
                        </div>
                        {vol.achievements && (
                          <ul className="list-disc ml-5 mt-2 text-gray-700">
                            {vol.achievements.map((achievement: string, i: number) => (
                              <li key={i}>{achievement}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                );
              }
              
              return null;
            })}
          </div>
        </div>
      </div>

      {/* Seeker Animation Button */}
      <div 
        className="fixed bottom-6 right-6 cursor-pointer transition-transform hover:scale-110"
        onClick={() => setIsChatOpen(true)}
      >
        <SeekerAnimation width={60} height={60} />
      </div>

      <Dialog open={styleDialogOpen} onOpenChange={setStyleDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Choose Resume Style</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 bg-white">
            {RESUME_STYLES.map((styleOption) => (
              <div 
                key={styleOption.id} 
                className={`border rounded-md p-4 cursor-pointer transition-all ${
                  style === styleOption.id 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:border-gray-400'
                } ${styleOption.color}`}
                onClick={() => {
                  setStyle(styleOption.id);
                  setStyleDialogOpen(false);
                }}
              >
                <h3 className="font-semibold mb-2">{styleOption.name}</h3>
                <div className="h-40 overflow-hidden">
                  <div className={`text-xs p-2 ${
                    styleOption.id === 'modern' ? 'border-b-2 border-blue-300' : 
                    styleOption.id === 'minimal' ? 'border-b border-gray-200' : 
                    styleOption.id === 'professional' ? 'border-b-2 border-amber-300' : 
                    styleOption.id === 'creative' ? 'border-b-2 border-purple-300' : 'border-b-2 border-neutral-200'
                  }`}>
                    <p className="font-bold">{firstName} {lastName}</p>
                    <p className="text-xs text-gray-600">{email} • {phone}</p>
                  </div>
                  <div className="mt-2">
                    <p className={`font-bold text-xs ${
                      styleOption.id === 'modern' ? 'text-blue-600' : 
                      styleOption.id === 'professional' ? 'text-amber-600' : 
                      styleOption.id === 'creative' ? 'text-purple-600' : 'text-gray-800'
                    }`}>Professional Experience</p>
                    <p className="text-xs mt-1 font-semibold">{latestExperience.jobTitle}</p>
                    <p className="text-xs text-gray-600">{latestExperience.companyName}, {latestExperience.startDate}-{latestExperience.endDate || 'Present'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
        <SeekerChatSheet
          chats={chats}
          inputValue={inputValue}
          isLoading={isChatLoading}
          isRetrying={isRetrying}
          apiError={apiError}
          analysisId={analysisId}
          currentThreadId={currentThreadId}
          messagesEndRef={messagesEndRef}
          setInputValue={setInputValue}
          onKeyDown={handleKeyDown}
          onSend={handleSend}
          onGenerateSuggestion={handleGenerateSuggestion}
          onRetry={handleRetry}
          onApplySuggestion={handleApplySuggestion}
          sheetDescriptionId="seeker-chat-description"
        />
      </Sheet>
    </div>
  );
};

export default ResumePreview;
