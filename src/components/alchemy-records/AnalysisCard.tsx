
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link as LinkIcon, Crown, FileEdit, ExternalLink, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AnalysisTitle from "./AnalysisTitle";
import StatusSelector from "../cover-letter/StatusSelector";
import { useCoverLetter } from "@/hooks/use-cover-letter";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/contexts/AuthContext";

interface Resume {
  file_name: string;
  file_path: string;
  formatted_resume: any | null;
}

interface Job {
  job_title: string;
  company_name: string | null;
  company_url: string | null;
  job_url: string | null;
}

interface AnalysisCardProps {
  id: string;
  created_at: string;
  google_doc_url: string | null;
  match_score: number | null;
  feedback: boolean | null;
  resume: Resume;
  job: Job | null;
  editingId: string | null;
  onStartEditing: (id: string) => void;
  onSaveTitle: (id: string, title: string) => void;
  onCancelEditing: () => void;
  onFeedback: (id: string, value: boolean | null) => void;
  onStatusChange?: () => void;
}

const AnalysisCard = ({
  id,
  created_at,
  google_doc_url,
  match_score,
  feedback,
  resume,
  job,
  editingId,
  onStartEditing,
  onSaveTitle,
  onCancelEditing,
  onFeedback,
  onStatusChange,
}: AnalysisCardProps) => {
  const jobTitle = job?.job_title || "Unnamed Position";
  const companyName = job?.company_name || "Unknown Company";
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('records');
  const { currentLanguage } = useLanguage();
  const { session } = useAuth();
  
  const { jobApplication, updateStatus } = useCoverLetter(id);
  const currentStatus = jobApplication?.status || "resume";

  const [isAddingJobUrl, setIsAddingJobUrl] = useState(false);
  const [jobUrl, setJobUrl] = useState("");
  const [isSavingJobUrl, setIsSavingJobUrl] = useState(false);
  const [isResearchingCompany, setIsResearchingCompany] = useState(false);

  const handleCreateCoverLetter = () => {
    navigate(`/${currentLanguage}/cover-letter`, {
      state: { analysisId: id }
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    await updateStatus(newStatus);
    if (onStatusChange) {
      onStatusChange();
    }
  };

  const handleAddJobUrl = () => {
    setIsAddingJobUrl(true);
    setJobUrl("");
  };

  const handleSaveJobUrl = async () => {
    if (!jobUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid job URL",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingJobUrl(true);

      // Get the job_id from the resume_analyses table
      const { data: analysisData, error: analysisError } = await supabase
        .from('resume_analyses')
        .select('job_id')
        .eq('id', id)
        .single();

      if (analysisError) {
        throw analysisError;
      }

      // Update the job_url in the jobs table
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ job_url: jobUrl.trim() })
        .eq('id', analysisData.job_id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Success",
        description: "Job URL has been saved successfully",
      });

      setIsAddingJobUrl(false);
      setJobUrl("");
      
      // Trigger refresh of the parent data
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save job URL. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingJobUrl(false);
    }
  };

  const handleCancelJobUrl = () => {
    setIsAddingJobUrl(false);
    setJobUrl("");
  };

  const handleCompanyResearch = async () => {
    // Prevent multiple simultaneous research requests
    if (isResearchingCompany) return;
    
    try {
      setIsResearchingCompany(true);
      
      // Get the job_id from the resume_analyses table
      const { data: analysisData, error: analysisError } = await supabase
        .from('resume_analyses')
        .select('job_id')
        .eq('id', id)
        .single();

      if (analysisError) {
        throw analysisError;
      }

      if (!analysisData.job_id) {
        toast({
          title: "Error",
          description: "No job information found for this analysis",
          variant: "destructive",
        });
        return;
      }

      // First check if company data already exists
      const { data: existingCompany, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('job_id', analysisData.job_id)
        .eq('user_id', session?.user?.id)
        .maybeSingle();

      if (companyError && companyError.code !== 'PGRST116') {
        throw companyError;
      }

      // If company data exists and is completed, navigate directly
      if (existingCompany && existingCompany.status === 'completed') {
        navigate(`/${currentLanguage}/company-research/${analysisData.job_id}`);
        return;
      }

      // If pending data exists, just navigate to the page
      if (existingCompany && existingCompany.status === 'pending') {
        navigate(`/${currentLanguage}/company-research/${analysisData.job_id}`);
        return;
      }

      // If no data exists, trigger the research and create pending record
      const { error: insertError } = await supabase
        .from('companies')
        .upsert({
          job_id: analysisData.job_id,
          user_id: session?.user?.id,
          status: 'pending'
        }, {
          onConflict: 'job_id,user_id',
          ignoreDuplicates: false
        });

      if (insertError) {
        throw insertError;
      }

      // Trigger the research
      const { error } = await supabase.functions.invoke('trigger-company-research', {
        body: { jobId: analysisData.job_id }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Company Research Started",
        description: "We're analyzing the company information. You'll be redirected to the results page.",
      });

      // Navigate to company research page
      navigate(`/${currentLanguage}/company-research/${analysisData.job_id}`);

    } catch (error) {
      console.error('Company research error:', error);
      toast({
        title: "Error",
        description: "Failed to start company research. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResearchingCompany(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resume":
        return "bg-blue-100 text-blue-800";
      case "cover_letter":
        return "bg-green-100 text-green-800";
      case "application_submitted":
        return "bg-purple-100 text-purple-800";
      case "following_up":
        return "bg-yellow-100 text-yellow-800";
      case "interview":
        return "bg-orange-100 text-orange-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "accepted":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "resume":
        return t('status.resume');
      case "cover_letter":
        return t('status.coverLetter');
      case "application_submitted":
        return t('status.applicationSubmitted');
      case "following_up":
        return t('status.followingUp');
      case "interview":
        return t('status.interview');
      case "rejected":
        return t('status.rejected');
      case "accepted":
        return t('status.accepted');
      default:
        return t('status.resume');
    }
  };

  const isPrimaryButton = (buttonType: string) => {
    if (currentStatus === "resume" && buttonType === "golden") return true;
    if (currentStatus === "cover_letter" && buttonType === "cover") return true;
    return false;
  };

  const getButtonVariant = (buttonType: string) => {
    return isPrimaryButton(buttonType) ? "default" : "outline";
  };

  const getButtonClassName = (buttonType: string) => {
    if (isPrimaryButton(buttonType)) {
      return "bg-gradient-primary-light text-white hover:opacity-90 transition-opacity";
    }
    return "flex items-center gap-2";
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-apple">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <AnalysisTitle
            title={jobTitle}
            isEditing={editingId === id}
            onEdit={() => onStartEditing(id)}
            onSave={(title) => onSaveTitle(id, title)}
            onCancel={onCancelEditing}
          />
          <p className="text-gray-600 text-sm mt-1">{companyName}</p>
        </div>
        
        {/* Status Badge in top right */}
        <div className="ml-4">
          <StatusSelector
            currentStatus={currentStatus}
            onStatusChange={handleStatusChange}
            disabled={false}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-neutral-600 mb-4">
        <span>
          {new Date(created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
        {match_score !== null && (
          <div className="font-semibold">
            Match: {Math.round(match_score * 100)}%
          </div>
        )}
      </div>

      {/* Job URL Input Section */}
      {isAddingJobUrl && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="mb-2">
            <p className="text-sm text-yellow-800 font-medium mb-2">
              {t('jobUrl.cannotChange')}
            </p>
            <Input
              type="url"
              placeholder={t('jobUrl.enterUrl')}
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              className="mb-3"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSaveJobUrl}
              disabled={isSavingJobUrl || !jobUrl.trim()}
            >
              {isSavingJobUrl ? t('jobUrl.saving') : t('jobUrl.save')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelJobUrl}
              disabled={isSavingJobUrl}
            >
              {t('jobUrl.cancel')}
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <Button
          variant={getButtonVariant("golden")}
          size="sm"
          onClick={() =>
            navigate(`/${currentLanguage}/resume-preview`, {
              state: {
                analysisId: id,
              },
            })
          }
          className={getButtonClassName("golden")}
        >
          <Crown className="h-4 w-4 mr-2" />
          {t('actions.viewGoldenResume')}
        </Button>

        <Button
          variant={getButtonVariant("cover")}
          size="sm"
          onClick={handleCreateCoverLetter}
          className={getButtonClassName("cover")}
        >
          <FileEdit className="h-4 w-4 mr-2" />
          {t('actions.createCoverLetter')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCompanyResearch}
          disabled={isResearchingCompany}
          className="flex items-center gap-2"
        >
          <Building2 className="h-4 w-4" />
          {isResearchingCompany ? t('actions.researching') : t('actions.companyResearch')}
        </Button>

        {job?.job_url ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(job.job_url, "_blank")}
            className="flex items-center gap-2"
          >
            <LinkIcon className="h-4 w-4" />
            {t('actions.applyJob')}
          </Button>
        ) : (
          !isAddingJobUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddJobUrl}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {t('actions.linkJD')}
            </Button>
          )
        )}
      </div>
    </div>
  );
};

export default AnalysisCard;
