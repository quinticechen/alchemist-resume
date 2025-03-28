
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Resume style variants
const RESUME_STYLES = [
  { id: 'classic', name: 'Classic', color: 'bg-white' },
  { id: 'modern', name: 'Modern', color: 'bg-blue-50' },
  { id: 'minimal', name: 'Minimal', color: 'bg-gray-50' },
  { id: 'professional', name: 'Professional', color: 'bg-amber-50' },
  { id: 'creative', name: 'Creative', color: 'bg-purple-50' },
];

const ResumePreview = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [resumeData, setResumeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [style, setStyle] = useState<string>('classic');
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);
  const { analysisId } = location.state || {};

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
        
        // First, fetch the resume editor content which has our formatted resume
        const { data: editorData, error: editorError } = await supabase
          .from('resume_editors')
          .select('content')
          .eq('analysis_id', analysisId)
          .single();
        
        if (editorError) throw editorError;
        
        if (!editorData || !editorData.content) {
          toast({ 
            title: "Resume content not found", 
            description: "Could not find resume content for preview", 
            variant: "destructive" 
          });
          navigate('/alchemy-records');
          return;
        }
        
        // Then fetch the analysis to get job and resume details
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
        
        if (analysisError) throw analysisError;
        
        if (!analysisData) {
          toast({ 
            title: "Resume not found", 
            description: "The requested resume could not be found", 
            variant: "destructive" 
          });
          navigate('/alchemy-records');
          return;
        }

        // Initialize with default values
        let jobTitle = 'Unnamed Position';
        let fileName = 'Resume';

        // Handle job data extraction safely
        if (analysisData.job) {
          // Check if job is an array
          if (Array.isArray(analysisData.job)) {
            if (analysisData.job.length > 0 && typeof analysisData.job[0] === 'object') {
              jobTitle = analysisData.job[0].job_title || jobTitle;
            }
          } 
          // Check if job is an object
          else if (typeof analysisData.job === 'object' && analysisData.job !== null) {
            jobTitle = analysisData.job.job_title || jobTitle;
          }
        }

        // Handle resume data extraction safely
        if (analysisData.resume) {
          // Check if resume is an array
          if (Array.isArray(analysisData.resume)) {
            if (analysisData.resume.length > 0 && typeof analysisData.resume[0] === 'object') {
              fileName = analysisData.resume[0].file_name || fileName;
            }
          } 
          // Check if resume is an object
          else if (typeof analysisData.resume === 'object' && analysisData.resume !== null) {
            fileName = analysisData.resume.file_name || fileName;
          }
        }

        setResumeData({
          ...analysisData,
          resume: editorData.content, // Use content from resume_editors
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

  const handleEditClick = () => {
    navigate('/resume-refine', { state: { analysisId } });
  };

  const handleExportPDF = async () => {
    if (!resumeRef.current) return;

    try {
      toast({ 
        title: "Preparing PDF", 
        description: "Your resume is being converted to PDF...", 
      });

      // Create canvas from DOM element
      const canvas = await html2canvas(resumeRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: style === 'classic' ? '#ffffff' : 
          style === 'modern' ? '#EFF6FF' : 
          style === 'minimal' ? '#F9FAFB' : 
          style === 'professional' ? '#FFFBEB' : 
          style === 'creative' ? '#F5F3FF' : '#ffffff'
      });

      // Create PDF (A4 size)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      
      // Download the PDF
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-primary text-transparent bg-clip-text">
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

          {/* Resume Content */}
          <div 
            ref={resumeRef}
            className={`bg-white rounded-xl p-8 shadow-apple relative group ${
              style === 'modern' ? 'bg-blue-50' : 
              style === 'minimal' ? 'bg-gray-50' : 
              style === 'professional' ? 'bg-amber-50' : 
              style === 'creative' ? 'bg-purple-50' : 'bg-white'
            }`}
          >
            {/* Edit button that appears on hover */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="outline"
                className="bg-white/80 backdrop-blur-sm"
                onClick={handleEditClick}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>

            {/* Personal Info Section */}
            <div className={`mb-6 pb-4 ${style === 'modern' ? 'border-b-2 border-blue-300' : 
              style === 'minimal' ? 'border-b border-gray-200' : 
              style === 'professional' ? 'border-b-2 border-amber-300' : 
              style === 'creative' ? 'border-b-2 border-purple-300' : 'border-b-2 border-neutral-200'}`}>
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

            {/* Professional Summary */}
            {resumeData.resume?.professionalSummary && (
              <div className="mb-6">
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

            {/* Professional Experience */}
            {resumeData.resume?.professionalExperience?.length > 0 && (
              <div className="mb-6">
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

            {/* Education */}
            {resumeData.resume?.education && (
              <div className="mb-6">
                <h2 className={`text-xl font-bold mb-2 ${
                  style === 'modern' ? 'text-blue-600' : 
                  style === 'professional' ? 'text-amber-600' : 
                  style === 'creative' ? 'text-purple-600' : 'text-gray-800'
                }`}>
                  Education
                </h2>
                <div>
                  <h3 className="font-bold text-gray-800">{resumeData.resume.education.degreeName}</h3>
                  <p className="text-gray-600">{resumeData.resume.education.institution}</p>
                  <p className="text-gray-500">Graduated: {resumeData.resume.education.graduationDate}</p>
                  {resumeData.resume.education.gpa && <p className="text-gray-500">GPA: {resumeData.resume.education.gpa}</p>}
                </div>
              </div>
            )}

            {/* Skills */}
            {resumeData.resume?.skills && (
              <div className="mb-6">
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

            {/* Projects */}
            {resumeData.resume?.projects?.length > 0 && (
              <div className="mb-6">
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

            {/* Certifications */}
            {resumeData.resume?.certifications?.length > 0 && (
              <div className="mb-6">
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
                      {cert.dateAchieved && <span className="text-gray-500"> ({cert.dateAchieved})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Volunteer */}
            {resumeData.resume?.volunteer?.length > 0 && (
              <div className="mb-6">
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

      {/* Style Dialog */}
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
                    <p className="font-bold">John Smith</p>
                    <p className="text-xs text-gray-600">john@example.com • (123) 456-7890</p>
                  </div>
                  <div className="mt-2">
                    <p className={`font-bold text-xs ${
                      styleOption.id === 'modern' ? 'text-blue-600' : 
                      styleOption.id === 'professional' ? 'text-amber-600' : 
                      styleOption.id === 'creative' ? 'text-purple-600' : 'text-gray-800'
                    }`}>Professional Experience</p>
                    <p className="text-xs mt-1 font-semibold">Software Developer</p>
                    <p className="text-xs text-gray-600">Tech Company, 2020-Present</p>
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
