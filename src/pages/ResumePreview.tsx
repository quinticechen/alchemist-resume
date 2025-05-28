import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Crown, 
  FileEdit, 
  Download, 
  FileText, 
  ExternalLink,
  ChevronLeft
} from "lucide-react";
import FeedbackButtons from "@/components/alchemy-records/FeedbackButtons";
import { toast } from "sonner";

interface ResumeData {
  id: string;
  created_at: string;
  google_doc_url: string | null;
  match_score: number | null;
  feedback: boolean | null;
  resume: {
    file_name: string;
    file_path: string;
    formatted_resume: any | null;
  };
  job: {
    job_title: string;
    company_name: string | null;
    company_url: string | null;
    job_url: string | null;
  } | null;
}

const ResumePreview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  const analysisId = location.state?.analysisId;

  useEffect(() => {
    if (!isLoading && !session) {
      navigate("/login", { state: { from: "/resume-preview" } });
      return;
    }

    if (!analysisId) {
      toast.error("No analysis ID provided");
      navigate("/alchemy-records");
      return;
    }

    fetchResumeData();
  }, [session, isLoading, analysisId, navigate]);

  const fetchResumeData = async () => {
    try {
      const { data, error } = await supabase
        .from('resume_analyses')
        .select(`
          id,
          created_at,
          google_doc_url,
          match_score,
          feedback,
          job:job_id (
            job_title,
            company_name,
            company_url,
            job_url
          ),
          resume:resume_id (
            file_name,
            file_path,
            formatted_resume
          )
        `)
        .eq('id', analysisId)
        .single();

      if (error) throw error;

      const resumeInfo = Array.isArray(data.resume) ? data.resume[0] : data.resume;
      const jobInfo = Array.isArray(data.job) ? data.job[0] : data.job;

      setResumeData({
        ...data,
        resume: resumeInfo,
        job: jobInfo
      });
    } catch (error) {
      console.error('Error fetching resume data:', error);
      toast.error("Failed to load resume data");
      navigate("/alchemy-records");
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = (value: boolean | null) => {
    if (resumeData) {
      setResumeData(prev => prev ? { ...prev, feedback: value } : null);
    }
  };

  const handleEditResume = () => {
    navigate("/alchemist-workshop", {
      state: { analysisId }
    });
  };

  const handleCreateCoverLetter = () => {
    navigate("/cover-letter", {
      state: { analysisId }
    });
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export functionality
    toast.info("PDF export functionality coming soon!");
  };

  const handleViewOriginalResume = () => {
    if (resumeData?.resume?.file_path) {
      // Construct the public URL for the resume file
      const { data } = supabase.storage
        .from('resumes')
        .getPublicUrl(resumeData.resume.file_path);
      
      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank');
      } else {
        toast.error("Unable to access original resume file");
      }
    }
  };

  const handleEditWithGoogleDoc = () => {
    if (resumeData?.google_doc_url) {
      window.open(resumeData.google_doc_url, '_blank');
    } else {
      toast.error("Google Doc URL not available");
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading resume preview...</p>
        </div>
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Resume data not found</p>
          <Button onClick={() => navigate("/alchemy-records")} className="mt-4">
            Back to Alchemy Records
          </Button>
        </div>
      </div>
    );
  }

  const jobTitle = resumeData.job?.job_title || "Unnamed Position";
  const companyName = resumeData.job?.company_name || "Unknown Company";

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/alchemy-records")}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Records
            </Button>
          </div>

          {/* Resume Info Card */}
          <div className="bg-white rounded-xl p-6 shadow-apple mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{jobTitle}</h1>
                <p className="text-gray-600">{companyName}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Generated on {new Date(resumeData.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                {resumeData.match_score && (
                  <p className="text-sm font-semibold text-purple-600 mt-1">
                    Match Score: {Math.round(resumeData.match_score * 100)}%
                  </p>
                )}
              </div>
              
              {/* Feedback Buttons */}
              <FeedbackButtons
                feedback={resumeData.feedback}
                onFeedback={handleFeedback}
                analysisId={resumeData.id}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleEditResume}
                className="bg-gradient-primary-light text-white hover:opacity-90 transition-opacity"
              >
                <Crown className="h-4 w-4 mr-2" />
                Edit Resume
              </Button>

              <Button
                variant="outline"
                onClick={() => {/* TODO: Implement change style */}}
                className="flex items-center gap-2"
              >
                <FileEdit className="h-4 w-4" />
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

              <Button
                variant="outline"
                onClick={handleViewOriginalResume}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Original Resume
              </Button>

              {resumeData.google_doc_url && (
                <Button
                  variant="outline"
                  onClick={handleEditWithGoogleDoc}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Edit with Google Doc
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleCreateCoverLetter}
                className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
              >
                <FileEdit className="h-4 w-4" />
                Create Cover Letter
              </Button>
            </div>
          </div>

          {/* Resume Preview Content */}
          <div className="bg-white rounded-xl p-6 shadow-apple">
            {resumeData.google_doc_url ? (
              <div className="w-full h-[800px]">
                <iframe
                  src={`${resumeData.google_doc_url}/preview`}
                  className="w-full h-full border-0 rounded-lg"
                  title="Resume Preview"
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  Resume preview not available. Please try regenerating the resume.
                </p>
                <Button
                  onClick={() => navigate("/alchemy-records")}
                  className="mt-4"
                >
                  Back to Records
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
