
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, FileText, Download, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ResumeSection } from '@/utils/resumeUtils';

const RESUME_STYLES = [
  { id: 'classic', name: 'Classic', color: 'bg-white' },
  { id: 'modern', name: 'Modern', color: 'bg-blue-50' },
  { id: 'minimal', name: 'Minimal', color: 'bg-gray-50' },
  { id: 'professional', name: 'Professional', color: 'bg-amber-50' },
  { id: 'creative', name: 'Creative', color: 'bg-purple-50' },
];

interface ResumeData {
  file_name?: string;
  file_path?: string;
  formatted_resume?: any;
}

interface JobData {
  job_title?: string;
  company_name?: string | null;
  company_url?: string | null;
  job_url?: string | null;
}

interface EditorContent {
  resume?: {
    personalInfo?: any;
    professionalSummary?: string;
    professionalExperience?: any[];
    education?: any;
    skills?: any;
    projects?: any[];
    volunteer?: any[];
    certifications?: any[];
  };
  sectionOrder?: ResumeSection[];
}

const LOCAL_STORAGE_STYLE_KEY = 'resumePreviewStyle';

const ResumePreview = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const [resumeData, setResumeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [style, setStyle] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_STYLE_KEY) || 'classic';
  });
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);
  const locationState = location.state || {};
  const paramAnalysisId = params.analysisId;
  const { analysisId: locationAnalysisId } = locationState;
  
  // Use the ID from URL params if available, otherwise from location state
  const analysisId = paramAnalysisId || locationAnalysisId;

  useEffect(() => {
    if (!isLoading && !session) {
      navigate('/login', { state: { from: '/resume-preview' } });
      return;
    }

    if (!analysisId) {
      navigate('/alchemy-records');
      return;
    }

    const fetchResumeData = async () => {
      try {
        setLoading(true);

        console.log("Fetching data for analysis ID:", analysisId);
        
        const { data: editorData, error: editorError } = await supabase
          .from('resume_editors')
          .select('content')
          .eq('analysis_id', analysisId)
          .maybeSingle();
        
        if (editorError) {
          console.error('Editor data error:', editorError);
          throw editorError;
        }
        
        if (!editorData || !editorData.content) {
          console.error('No editor content found');
          toast({ 
            title: "Resume content not found", 
            description: "Could not find resume content for preview", 
            variant: "destructive" 
          });
          navigate('/alchemy-records');
          return;
        }

        console.log("Found editor content:", editorData.content);
        
        const { data: analysisData, error: analysisError } = await supabase
          .from('resume_analyses')
          .select(`
            id,
            google_doc_url,
            resume:resume_id(file_name),
            job:job_id(job_title)
          `)
          .eq('id', analysisId)
          .single();
        
        if (analysisError) {
          console.error('Analysis data error:', analysisError);
          throw analysisError;
        }
        
        if (!analysisData) {
          console.error('No analysis data found');
          toast({ 
            title: "Resume not found", 
            description: "The requested resume could not be found", 
            variant: "destructive" 
          });
          navigate('/alchemy-records');
          return;
        }

        console.log("Found analysis data:", analysisData);

        let jobTitle = 'Unnamed Position';
        let fileName = 'Resume';

        if (analysisData.job) {
          if (Array.isArray(analysisData.job)) {
            const firstJob = analysisData.job[0] as JobData;
            if (firstJob && firstJob.job_title) {
              jobTitle = firstJob.job_title;
            }
          } else if (typeof analysisData.job === 'object' && analysisData.job !== null) {
            const jobObj = analysisData.job as JobData;
            if (jobObj.job_title) {
              jobTitle = jobObj.job_title;
            }
          }
        }

        if (analysisData.resume) {
          if (Array.isArray(analysisData.resume)) {
            const firstResume = analysisData.resume[0] as ResumeData;
            if (firstResume && firstResume.file_name) {
              fileName = firstResume.file_name;
            }
          } else if (typeof analysisData.resume === 'object' && analysisData.resume !== null) {
            const resumeObj = analysisData.resume as ResumeData;
            if (resumeObj.file_name) {
              fileName = resumeObj.file_name;
            }
          }
        }

        const content = editorData.content as EditorContent;
        console.log("Preparing resume data with content:", content);

        setResumeData({
          ...analysisData,
          resume: content.resume || {},
          sectionOrder: content.sectionOrder || [],
          jobTitle,
          fileName,
          googleDocUrl: analysisData.google_doc_url
        });
      } catch (error) {
        console.error('Error fetching resume data:', error);
        toast({ 
          title: "Error", 
          description: "Failed to load resume data", 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResumeData();
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
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const canvas = await html2canvas(resumeElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: bgColor,
      });
      
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let remainingHeight = canvas.height;
      let position = 0;
      
      while (remainingHeight > 0) {
        const pageCanvas = document.createElement('canvas');
        const ctx = pageCanvas.getContext('2d');
        
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(canvas.width * (pageHeight / pageWidth), remainingHeight);
        
        if (ctx) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas, 
            0, position, canvas.width, pageCanvas.height, 
            0, 0, pageCanvas.width, pageCanvas.height
          );
        }
        
        position += pageCanvas.height;
        remainingHeight -= pageCanvas.height;
        
        if (position > 0 && remainingHeight > 0) {
          pdf.addPage();
        }
        
        const imgData = pageCanvas.toDataURL('image/jpeg', 1.0);
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
      }
      
      const fileName = resumeData?.jobTitle 
        ? `Resume_${resumeData.jobTitle.replace(/\s+/g, '_')}.pdf` 
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
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!resumeData) {
    return null;
  }

  console.log("Rendering with resume data:", resumeData);

  const personalInfo = resumeData.resume?.personalInfo || {};
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center mb-6 text-center">
            <h1 className="text-3xl font-bold bg-gradient-primary text-transparent bg-clip-text mb-4">
              {resumeData.jobTitle}
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

            {resumeData.resume?.professionalSummary && (
              <div className="mb-6 relative group">
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
                <p className="text-gray-700">{resumeData.resume.professionalSummary}</p>
              </div>
            )}

            {resumeData.resume?.professionalExperience?.length > 0 && (
              <div className="mb-6 relative group">
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
                {resumeData.resume.professionalExperience.map((exp: any, index: number) => (
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
            )}

            {resumeData.resume?.education && (
              <div className="mb-6 relative group">
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
                <h2 className={`text-xl font-bold mb-2 ${
                  style === 'modern' ? 'text-blue-600' : 
                  style === 'professional' ? 'text-amber-600' : 
                  style === 'creative' ? 'text-purple-600' : 'text-gray-800'
                }`}>
                  Education
                </h2>
                
                {Array.isArray(resumeData.resume.education) ? (
                  resumeData.resume.education.map((edu: any, index: number) => (
                    <div key={index} className="mb-3">
                      <h3 className="font-bold text-gray-800">{edu.degreeName}</h3>
                      <p className="text-gray-600">{edu.institution}</p>
                      {edu.enrollmentDate && edu.graduationDate ? (
                        <p className="text-gray-500">{edu.enrollmentDate} - {edu.graduationDate}</p>
                      ) : (
                        <p className="text-gray-500">Graduated: {edu.graduationDate}</p>
                      )}
                      {edu.gpa && <p className="text-gray-500">GPA: {edu.gpa}</p>}
                    </div>
                  ))
                ) : (
                  <div>
                    <h3 className="font-bold text-gray-800">{resumeData.resume.education.degreeName}</h3>
                    <p className="text-gray-600">{resumeData.resume.education.institution}</p>
                    {resumeData.resume.education.enrollmentDate && resumeData.resume.education.graduationDate ? (
                      <p className="text-gray-500">{resumeData.resume.education.enrollmentDate} - {resumeData.resume.education.graduationDate}</p>
                    ) : (
                      <p className="text-gray-500">Graduated: {resumeData.resume.education.graduationDate}</p>
                    )}
                    {resumeData.resume.education.gpa && <p className="text-gray-500">GPA: {resumeData.resume.education.gpa}</p>}
                  </div>
                )}
              </div>
            )}

            {resumeData.resume?.skills && (
              <div className="mb-6 relative group">
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
                  {resumeData.resume.skills.technical && (
                    <div>
                      <h3 className="font-bold text-gray-700 mb-1">Technical Skills</h3>
                      <ul className="list-disc ml-5 text-gray-700">
                        {resumeData.resume.skills.technical.map((skill: string, i: number) => (
                          <li key={i}>{skill}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {resumeData.resume.skills.soft && (
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
            )}

            {resumeData.resume?.projects?.length > 0 && (
              <div className="mb-6 relative group">
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
                {resumeData.resume.projects.map((project: any, index: number) => (
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
            )}

            {resumeData.resume?.certifications?.length > 0 && (
              <div className="mb-6 relative group">
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
                  {resumeData.resume.certifications.map((cert: any, i: number) => (
                    <li key={i}>
                      {cert.name} 
                      {cert.dateAchieved && <span className="text-gray-500"> (Achieved: {cert.dateAchieved}</span>}
                      {cert.expiredDate && <span className="text-gray-500">, Expires: {cert.expiredDate}</span>}
                      {cert.dateAchieved && <span className="text-gray-500">)</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {resumeData.resume?.volunteer?.length > 0 && (
              <div className="mb-6 relative group">
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
                {resumeData.resume.volunteer.map((vol: any, index: number) => (
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
            )}
          </div>
        </div>
      </div>

      <Dialog open={styleDialogOpen} onOpenChange={setStyleDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Choose Resume Style</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
    </div>
  );
};

export default ResumePreview;
