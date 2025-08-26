
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, FileText, Download, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ResumeSection } from "@/utils/resumeUtils";
import Lottie from "react-lottie";
import Loading from "@/animations/Loading.json";
import FeedbackButtons from "@/components/alchemy-records/FeedbackButtons";
import { useTranslation } from "react-i18next";

const loadingOptions = {
  loop: true,
  autoplay: true,
  animationData: Loading,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};

const getResumeStyles = (t: any) => [
  { id: "classic", name: t('resume-preview:styles.classic'), color: "bg-white" },
  { id: "modern", name: t('resume-preview:styles.modern'), color: "bg-blue-50" },
  { id: "minimal", name: t('resume-preview:styles.minimal'), color: "bg-gray-50" },
  { id: "professional", name: t('resume-preview:styles.professional'), color: "bg-amber-50" },
  { id: "creative", name: t('resume-preview:styles.creative'), color: "bg-purple-50" },
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
  resume?: ResumeContent;
  sectionOrder?: ResumeSection[];
}

interface ResumeContent {
  personalInfo?: any;
  summary?: string;
  professionalSummary?: string;
  professionalExperience?: Array<{
    companyName?: string;
    companyIntroduction?: string;
    location?: string;
    jobTitle?: string;
    startDate?: string;
    endDate?: string;
    achievements?: string[];
  }>;
  education?: any;
  skills?: any;
  projects?: any[];
  volunteer?: any[];
  certifications?: any[];
  guidanceForOptimization?: Array<{
    guidance: string[];
  }>;
}

const LOCAL_STORAGE_STYLE_KEY = "resumePreviewStyle";

const isSectionEmpty = (data: any, section: string): boolean => {
  if (!data || !data.resume) return true;

  const sectionMapping: Record<string, string[]> = {
    personalInfo: ["personalInfo"],
    professionalSummary: ["summary", "professionalSummary"],
    professionalExperience: ["professionalExperience", "experience"],
    education: ["education"],
    skills: ["skills"],
    projects: ["projects"],
    volunteer: ["volunteer"],
    certifications: ["certifications"],
  };

  const possibleKeys = sectionMapping[section] || [section];

  for (const key of possibleKeys) {
    const sectionData = data.resume[key];

    if (key === "personalInfo") {
      if (sectionData && Object.keys(sectionData).length > 0) return false;
    } else if (key === "summary" || key === "professionalSummary") {
      if (sectionData && sectionData.trim() !== "") return false;
    } else if (key === "skills") {
      // Check if skills has any content
      if (sectionData) {
        if (sectionData.technical && Array.isArray(sectionData.technical) && sectionData.technical.length > 0) return false;
        if (sectionData.soft && Array.isArray(sectionData.soft) && sectionData.soft.length > 0) return false;
        if (Array.isArray(sectionData) && sectionData.length > 0) return false;
        if (typeof sectionData === 'string' && sectionData.trim() !== '') return false;
      }
    } else if (key === "education") {
      // Check if education has content
      if (sectionData) {
        if (Array.isArray(sectionData) && sectionData.length > 0) return false;
        if (typeof sectionData === 'object' && Object.keys(sectionData).length > 0) return false;
      }
    } else if (Array.isArray(sectionData)) {
      if (sectionData && sectionData.length > 0) return false;
    } else if (sectionData) {
      return false;
    }
  }

  return true;
};

const DEFAULT_SECTION_ORDER: ResumeSection[] = [
  "personalInfo",
  "professionalSummary",
  "professionalExperience",
  "education",
  "skills",
  "projects",
  "volunteer",
  "certifications",
];

const normalizeResumeData = (data: any): EditorContent => {
  if (!data) return { resume: {} };

  console.log("Normalizing resume data:", data);

  let result: EditorContent = { resume: {} };

  if (data.resume) {
    if (data.resume.resume) {
      result = {
        resume: data.resume.resume,
        sectionOrder: data.sectionOrder || DEFAULT_SECTION_ORDER,
      };
    } else {
      result = data;
    }
  } else if (
    Object.keys(data).includes("personalInfo") ||
    Object.keys(data).includes("professionalExperience")
  ) {
    result = { resume: data };
  }

  return result;
};

const ResumePreview = () => {
  const { t } = useTranslation(['common', 'resume-preview']);
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const [resumeData, setResumeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [style, setStyle] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_STYLE_KEY) || "classic";
  });
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const resumeRef = useRef<HTMLDivElement>(null);
  const locationState = location.state || {};
  const paramAnalysisId = params.analysisId;
  const { analysisId: locationAnalysisId } = locationState;

  const analysisId = paramAnalysisId || locationAnalysisId;

  useEffect(() => {
    if (!isLoading && !session && !analysisId) {
      navigate("/login", { state: { from: "/resume-preview" } });
      return;
    }

    if (!analysisId) {
      navigate("/alchemy-records");
      return;
    }

    const fetchResumeData = async () => {
      try {
        setLoading(true);

        console.log("Fetching data for analysis ID:", analysisId);

        const { data: editorData, error: editorError } = await supabase
          .from("resume_editors")
          .select("content")
          .eq("analysis_id", analysisId)
          .maybeSingle();

        if (editorError) {
          console.error("Editor data error:", editorError);
          throw editorError;
        }

        if (!editorData || !editorData.content) {
          console.error("No editor content found");
          toast({
            title: "Resume content not found",
            description: "Could not find resume content for preview",
            variant: "destructive",
          });
          navigate("/alchemy-records");
          return;
        }

        console.log("Found editor content:", editorData.content);

        const normalizedContent = normalizeResumeData(editorData.content);
        console.log("Normalized content:", normalizedContent);

        const { data: analysisData, error: analysisError } = await supabase
          .from("resume_analyses")
          .select(
            `
            id,
            google_doc_url,
            feedback,
            resume:resume_id(file_name, file_path),
            job:job_id(job_title)
          `
          )
          .eq("id", analysisId)
          .single();

        if (analysisError) {
          console.error("Analysis data error:", analysisError);
          throw analysisError;
        }

        if (!analysisData) {
          console.error("No analysis data found");
          toast({
            title: "Resume not found",
            description: "The requested resume could not be found",
            variant: "destructive",
          });
          navigate("/alchemy-records");
          return;
        }

        console.log("Found analysis data:", analysisData);

        let jobTitle = "Unnamed Position";
        let fileName = "Resume";

        if (analysisData.job) {
          if (Array.isArray(analysisData.job)) {
            const firstJob = analysisData.job[0] as JobData;
            if (firstJob && firstJob.job_title) {
              jobTitle = firstJob.job_title;
            }
          } else if (
            typeof analysisData.job === "object" &&
            analysisData.job !== null
          ) {
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
          } else if (
            typeof analysisData.resume === "object" &&
            analysisData.resume !== null
          ) {
            const resumeObj = analysisData.resume as ResumeData;
            if (resumeObj.file_name) {
              fileName = resumeObj.file_name;
            }
          }
        }

        const sectionOrder =
          normalizedContent.sectionOrder &&
          Array.isArray(normalizedContent.sectionOrder) &&
          normalizedContent.sectionOrder.length > 0
            ? normalizedContent.sectionOrder
            : DEFAULT_SECTION_ORDER;

        setResumeData({
          ...analysisData,
          resume: normalizedContent.resume || {},
          sectionOrder: sectionOrder,
          jobTitle,
          fileName,
          googleDocUrl: analysisData.google_doc_url,
          originalResume: analysisData.resume,
        });
        
        setFeedback(analysisData.feedback);
      } catch (error) {
        console.error("Error fetching resume data:", error);
        toast({
          title: "Error",
          description: "Failed to load resume data",
          variant: "destructive",
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

  const handleFeedback = (value: boolean | null) => {
    setFeedback(value);
  };

  const handleEditSection = (section: ResumeSection) => {
    navigate(`/resume-refine/${analysisId}`, {
      state: {
        analysisId,
        section,
      },
    });
  };

  const handleEditClick = () => {
    if (!session) {
      toast({
        title: "Login Required",
        description: "You need to log in to edit this resume",
        variant: "destructive",
      });
      navigate("/login", {
        state: {
          from: `/resume-refine/${analysisId}`,
        },
      });
      return;
    }

    navigate(`/resume-refine/${analysisId}`, {
      state: { analysisId },
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

      const bgColor =
        style === "classic"
          ? "#ffffff"
          : style === "modern"
          ? "#EFF6FF"
          : style === "minimal"
          ? "#F9FAFB"
          : style === "professional"
          ? "#FFFBEB"
          : style === "creative"
          ? "#F5F3FF"
          : "#ffffff";

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
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

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvasWidth;
        tempCanvas.height = srcHeight;

        const ctx = tempCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            srcY,
            canvasWidth,
            srcHeight,
            0,
            0,
            canvasWidth,
            srcHeight
          );

          const imgData = tempCanvas.toDataURL("image/jpeg", 1.0);
          pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, srcHeight / ratio);
        }
      }

      const fileName = resumeData?.jobTitle
        ? `Resume_${resumeData.jobTitle.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`
        : "Resume.pdf";

      pdf.save(fileName);

      toast({
        title: "PDF Exported",
        description: "Your resume has been successfully downloaded",
        variant: "default",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export resume to PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || loading) {
    return (
      <div className="w-64 h-64 mx-auto">
        <Lottie options={loadingOptions} />
      </div>
    );
  }

  if (!resumeData) {
    return null;
  }

  console.log("Rendering with resume data:", resumeData);

  const personalInfo = resumeData.resume?.personalInfo || {};
  const experiences = resumeData.resume?.professionalExperience || [];
  const firstName = personalInfo.firstName || "John";
  const lastName = personalInfo.lastName || "Smith";
  const email = personalInfo.email || "email@example.com";
  const phone = personalInfo.phone || "(123) 456-7890";
  const website = personalInfo.website || "https://example.com";

  const latestExperience =
    experiences && experiences.length > 0
      ? experiences[0]
      : {
          jobTitle: "Software Developer",
          companyName: "Tech Company",
          startDate: "2020",
          endDate: "Present",
        };

  const orderedSections = resumeData.sectionOrder || DEFAULT_SECTION_ORDER;
  const RESUME_STYLES = getResumeStyles(t);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      {/* <OozeDialog 
        position="bottom" 
        title="Resume Alchemist" 
        resumeEditMode={true}
      /> */}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center mb-6 text-center">
            <h1 className="text-3xl font-bold bg-gradient-primary text-transparent bg-clip-text mb-4">
              {resumeData.jobTitle}
            </h1>
            <div className="flex gap-4 flex-wrap justify-center">
              <Button
                variant="outline"
                onClick={handleEditClick}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                {t('resume-preview:buttons.editResume')}
              </Button>

              <Button
                variant="outline"
                onClick={() => setStyleDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {t('resume-preview:buttons.changeStyle')}
              </Button>

              <Button
                variant="outline"
                onClick={handleExportPDF}
                className="bg-gradient-primary-light text-white hover:opacity-90 transition-opacity"
              >
                <Download className="h-4 w-4" />
                {t('resume-preview:buttons.exportPDF')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (resumeData.originalResume?.file_path) {
                    const { data } = supabase.storage
                      .from("resumes")
                      .getPublicUrl(resumeData.originalResume.file_path);
                    window.open(data.publicUrl, "_blank");
                  }
                }}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {t('resume-preview:buttons.originalResume')}
              </Button>

              {resumeData.googleDocUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(resumeData.googleDocUrl, "_blank")}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  {t('resume-preview:buttons.editWithGoogleDoc')}
                </Button>
              )}

              <FeedbackButtons
                feedback={feedback}
                onFeedback={handleFeedback}
                analysisId={analysisId}
              />
            </div>
          </div>

          <div
            ref={resumeRef}
            className={`bg-white rounded-xl p-8 shadow-apple relative ${
              style === "modern"
                ? "bg-blue-50"
                : style === "minimal"
                ? "bg-gray-50"
                : style === "professional"
                ? "bg-amber-50"
                : style === "creative"
                ? "bg-purple-50"
                : "bg-white"
            }`}
          >
            <div
              className={`mb-6 pb-4 relative group ${
                style === "modern"
                  ? "border-b-2 border-blue-300"
                  : style === "minimal"
                  ? "border-b border-gray-200"
                  : style === "professional"
                  ? "border-b-2 border-amber-300"
                  : style === "creative"
                  ? "border-b-2 border-purple-300"
                  : "border-b-2 border-neutral-200"
              }`}
            >
              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full h-8 w-8 p-0"
                  onClick={() => handleEditSection("personalInfo")}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <h1
                className={`text-3xl font-bold mb-2 ${
                  style === "modern"
                    ? "text-blue-700"
                    : style === "professional"
                    ? "text-amber-700"
                    : style === "creative"
                    ? "text-purple-700"
                    : "text-gray-800"
                }`}
              >
                {resumeData.resume?.personalInfo?.firstName}{" "}
                {resumeData.resume?.personalInfo?.lastName}
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
                {resumeData.resume?.personalInfo?.website && (
                  <span>• {resumeData.resume.personalInfo.website}</span>
                )}
              </div>
            </div>

            {orderedSections.map((sectionKey) => {
              if (sectionKey === "personalInfo") return null;

              // Check if section is empty before rendering
              if (isSectionEmpty(resumeData, sectionKey)) {
                return null;
              }

              if (sectionKey === "professionalSummary") {
                const summaryText =
                  resumeData.resume?.summary ||
                  resumeData.resume?.professionalSummary ||
                  "";

                if (summaryText && summaryText.trim() !== "") {
                  return (
                    <div key={sectionKey} className="mb-6 relative group">
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-full h-8 w-8 p-0"
                          onClick={() =>
                            handleEditSection("professionalSummary")
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <h2
                        className={`text-xl font-bold mb-2 ${
                          style === "modern"
                            ? "text-blue-600"
                            : style === "professional"
                            ? "text-amber-600"
                            : style === "creative"
                            ? "text-purple-600"
                            : "text-gray-800"
                        }`}
                      >
                        {t('resume-preview:sections.professionalSummary')}
                      </h2>
                      <p className="text-gray-700">{summaryText}</p>
                    </div>
                  );
                }
                return null;
              }

              if (
                sectionKey === "professionalExperience" &&
                resumeData.resume?.professionalExperience?.length > 0
              ) {
                return (
                  <div key={sectionKey} className="mb-6 relative group">
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full h-8 w-8 p-0"
                        onClick={() =>
                          handleEditSection("professionalExperience")
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <h2
                      className={`text-xl font-bold mb-2 ${
                        style === "modern"
                          ? "text-blue-600"
                          : style === "professional"
                          ? "text-amber-600"
                          : style === "creative"
                          ? "text-purple-600"
                          : "text-gray-800"
                      }`}
                    >
                      {t('resume-preview:sections.professionalExperience')}
                    </h2>
                    {resumeData.resume.professionalExperience.map(
                      (exp: any, index: number) => (
                        <div key={index} className="mb-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-gray-800">
                                {exp.jobTitle}
                              </h3>
                              <p className="text-gray-600">
                                {exp.companyName}
                                {exp.location ? `, ${exp.location}` : ""}
                              </p>
                            </div>
                            <p className="text-gray-500 text-sm">
                              {exp.startDate} - {exp.endDate || "Present"}
                            </p>
                          </div>
                          {exp.companyIntroduction && (
                            <p className="text-sm text-gray-600 mt-1 italic">
                              {exp.companyIntroduction}
                            </p>
                          )}
                          {exp.achievements && (
                            <ul className="list-disc ml-5 mt-2 text-gray-700">
                              {exp.achievements.map(
                                (achievement: string, i: number) => (
                                  <li key={i}>{achievement}</li>
                                )
                              )}
                            </ul>
                          )}
                        </div>
                      )
                    )}
                  </div>
                );
              }

              if (sectionKey === "education" && resumeData.resume?.education) {
                return (
                  <div key={sectionKey} className="mb-6 relative group">
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full h-8 w-8 p-0"
                        onClick={() => handleEditSection("education")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <h2
                      className={`text-xl font-bold mb-2 ${
                        style === "modern"
                          ? "text-blue-600"
                          : style === "professional"
                          ? "text-amber-600"
                          : style === "creative"
                          ? "text-purple-600"
                          : "text-gray-800"
                      }`}
                    >
                      {t('resume-preview:sections.education')}
                    </h2>

                    {Array.isArray(resumeData.resume.education) ? (
                      resumeData.resume.education.map(
                        (edu: any, index: number) => (
                          <div key={index} className="mb-3">
                            <h3 className="font-bold text-gray-800">
                              {edu.degreeName}
                            </h3>
                            <p className="text-gray-600">{edu.institution}</p>
                            {edu.enrollmentDate && edu.graduationDate ? (
                              <p className="text-gray-500">
                                {edu.enrollmentDate} - {edu.graduationDate}
                              </p>
                            ) : (
                              <p className="text-gray-500">
                                Graduated: {edu.graduationDate}
                              </p>
                            )}
                            {edu.gpa && (
                              <p className="text-gray-500">GPA: {edu.gpa}</p>
                            )}
                          </div>
                        )
                      )
                    ) : (
                      <div>
                        <h3 className="font-bold text-gray-800">
                          {resumeData.resume.education.degreeName}
                        </h3>
                        <p className="text-gray-600">
                          {resumeData.resume.education.institution}
                        </p>
                        {resumeData.resume.education.enrollmentDate &&
                        resumeData.resume.education.graduationDate ? (
                          <p className="text-gray-500">
                            {resumeData.resume.education.enrollmentDate} -{" "}
                            {resumeData.resume.education.graduationDate}
                          </p>
                        ) : (
                          <p className="text-gray-500">
                            Graduated:{" "}
                            {resumeData.resume.education.graduationDate}
                          </p>
                        )}
                        {resumeData.resume.education.gpa && (
                          <p className="text-gray-500">
                            GPA: {resumeData.resume.education.gpa}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              if (sectionKey === "skills" && resumeData.resume?.skills) {
                const skillsData = resumeData.resume.skills;
                const hasTechnical = skillsData.technical && Array.isArray(skillsData.technical) && skillsData.technical.length > 0;
                const hasSoft = skillsData.soft && Array.isArray(skillsData.soft) && skillsData.soft.length > 0;
                
                if (hasTechnical || hasSoft) {
                  return (
                    <div key={sectionKey} className="mb-6 relative group">
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-full h-8 w-8 p-0"
                          onClick={() => handleEditSection("skills")}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <h2
                        className={`text-xl font-bold mb-2 ${
                          style === "modern"
                            ? "text-blue-600"
                            : style === "professional"
                            ? "text-amber-600"
                            : style === "creative"
                            ? "text-purple-600"
                            : "text-gray-800"
                        }`}
                      >
                        {t('resume-preview:sections.skills')}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {hasTechnical && (
                          <div>
                            <h3 className="font-bold text-gray-700 mb-1">
                              Technical Skills
                            </h3>
                            <ul className="list-disc ml-5 text-gray-700">
                              {skillsData.technical.map(
                                (skill: string, i: number) => (
                                  <li key={i}>{skill}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                        {hasSoft && (
                          <div>
                            <h3 className="font-bold text-gray-700 mb-1">
                              Soft Skills
                            </h3>
                            <ul className="list-disc ml-5 text-gray-700">
                              {skillsData.soft.map(
                                (skill: string, i: number) => (
                                  <li key={i}>{skill}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }

              if (
                sectionKey === "projects" &&
                resumeData.resume?.projects?.length > 0
              ) {
                return (
                  <div key={sectionKey} className="mb-6 relative group">
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full h-8 w-8 p-0"
                        onClick={() => handleEditSection("projects")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <h2
                      className={`text-xl font-bold mb-2 ${
                        style === "modern"
                          ? "text-blue-600"
                          : style === "professional"
                          ? "text-amber-600"
                          : style === "creative"
                          ? "text-purple-600"
                          : "text-gray-800"
                      }`}
                    >
                      {t('resume-preview:sections.projects')}
                    </h2>
                    {resumeData.resume.projects.map(
                      (project: any, index: number) => (
                        <div key={index} className="mb-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-gray-800">
                              {project.name}
                            </h3>
                            {project.startDate && (
                              <p className="text-gray-500 text-sm">
                                {project.startDate} -{" "}
                                {project.endDate || "Present"}
                              </p>
                            )}
                          </div>
                          {project.achievements && (
                            <ul className="list-disc ml-5 mt-2 text-gray-700">
                              {project.achievements.map(
                                (achievement: string, i: number) => (
                                  <li key={i}>{achievement}</li>
                                )
                              )}
                            </ul>
                          )}
                        </div>
                      )
                    )}
                  </div>
                );
              }

              if (
                sectionKey === "certifications" &&
                resumeData.resume?.certifications?.length > 0
              ) {
                return (
                  <div key={sectionKey} className="mb-6 relative group">
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full h-8 w-8 p-0"
                        onClick={() => handleEditSection("certifications")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <h2
                      className={`text-xl font-bold mb-2 ${
                        style === "modern"
                          ? "text-blue-600"
                          : style === "professional"
                          ? "text-amber-600"
                          : style === "creative"
                          ? "text-purple-600"
                          : "text-gray-800"
                      }`}
                    >
                      {t('resume-preview:sections.certifications')}
                    </h2>
                    <ul className="list-disc ml-5 text-gray-700">
                      {resumeData.resume.certifications.map(
                        (cert: any, i: number) => (
                          <li key={i}>
                            {cert.name}
                            {cert.dateAchieved && (
                              <span className="text-gray-500">
                                {" "}
                                (Achieved: {cert.dateAchieved}
                              </span>
                            )}
                            {cert.expiredDate && (
                              <span className="text-gray-500">
                                , Expires: {cert.expiredDate}
                              </span>
                            )}
                            {cert.dateAchieved && (
                              <span className="text-gray-500">)</span>
                            )}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                );
              }

              if (
                sectionKey === "volunteer" &&
                resumeData.resume?.volunteer?.length > 0
              ) {
                return (
                  <div key={sectionKey} className="mb-6 relative group">
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full h-8 w-8 p-0"
                        onClick={() => handleEditSection("volunteer")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <h2
                      className={`text-xl font-bold mb-2 ${
                        style === "modern"
                          ? "text-blue-600"
                          : style === "professional"
                          ? "text-amber-600"
                          : style === "creative"
                          ? "text-purple-600"
                          : "text-gray-800"
                      }`}
                    >
                      {t('resume-preview:sections.volunteerExperience')}
                    </h2>
                    {resumeData.resume.volunteer.map(
                      (vol: any, index: number) => (
                        <div key={index} className="mb-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-gray-800">
                              {vol.name}
                            </h3>
                            {vol.startDate && (
                              <p className="text-gray-500 text-sm">
                                {vol.startDate} - {vol.endDate || "Present"}
                              </p>
                            )}
                          </div>
                          {vol.achievements && (
                            <ul className="list-disc ml-5 mt-2 text-gray-700">
                              {vol.achievements.map(
                                (achievement: string, i: number) => (
                                  <li key={i}>{achievement}</li>
                                )
                              )}
                            </ul>
                          )}
                        </div>
                      )
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
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
                    ? "ring-2 ring-primary border-primary"
                    : "hover:border-gray-400"
                } ${styleOption.color}`}
                onClick={() => {
                  setStyle(styleOption.id);
                  setStyleDialogOpen(false);
                }}
              >
                <h3 className="font-semibold mb-2">{styleOption.name}</h3>
                <div className="h-40 overflow-hidden">
                  <div
                    className={`text-xs p-2 ${
                      styleOption.id === "modern"
                        ? "border-b-2 border-blue-300"
                        : styleOption.id === "minimal"
                        ? "border-b border-gray-200"
                        : styleOption.id === "professional"
                        ? "border-b-2 border-amber-300"
                        : styleOption.id === "creative"
                        ? "border-b-2 border-purple-300"
                        : "border-b-2 border-neutral-200"
                    }`}
                  >
                    <p className="font-bold">
                      {firstName} {lastName}
                    </p>
                    <p className="text-xs text-gray-600">
                      {email} • {phone}
                    </p>
                  </div>
                  <div className="mt-2">
                    <p
                      className={`font-bold text-xs ${
                        styleOption.id === "modern"
                          ? "text-blue-600"
                          : styleOption.id === "professional"
                          ? "text-amber-600"
                          : styleOption.id === "creative"
                          ? "text-purple-600"
                          : "text-gray-800"
                      }`}
                    >
                      Professional Experience
                    </p>
                    <p className="text-xs mt-1 font-semibold">
                      {latestExperience.jobTitle}
                    </p>
                    <p className="text-xs text-gray-600">
                      {latestExperience.companyName},{" "}
                      {latestExperience.startDate}-
                      {latestExperience.endDate || "Present"}
                    </p>
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
