import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link as LinkIcon, Crown, FileEdit, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AnalysisTitle from "./AnalysisTitle";
import StatusSelector from "../cover-letter/StatusSelector";
import { useCoverLetter } from "@/hooks/use-cover-letter";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  
  const { jobApplication, updateStatus } = useCoverLetter(id);
  const currentStatus = jobApplication?.status || "resume";

  const [isAddingJobUrl, setIsAddingJobUrl] = useState(false);
  const [jobUrl, setJobUrl] = useState("");
  const [isSavingJobUrl, setIsSavingJobUrl] = useState(false);

  const handleCreateCoverLetter = () => {
    navigate("/cover-letter", {
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
      console.error('Error saving job URL:', error);
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
        return "Resume";
      case "cover_letter":
        return "Cover Letter";
      case "application_submitted":
        return "Application Submitted";
      case "following_up":
        return "Following Up";
      case "interview":
        return "Interview";
      case "rejected":
        return "Rejected";
      case "accepted":
        return "Accepted";
      default:
        return "Resume";
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
              ⚠️ Warning: The job URL cannot be changed after saving.
            </p>
            <Input
              type="url"
              placeholder="Enter job posting URL"
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
              {isSavingJobUrl ? "Saving..." : "Save"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelJobUrl}
              disabled={isSavingJobUrl}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <Button
          variant={getButtonVariant("golden")}
          size="sm"
          onClick={() =>
            navigate("/resume-preview", {
              state: {
                analysisId: id,
              },
            })
          }
          className={getButtonClassName("golden")}
        >
          <Crown className="h-4 w-4 mr-2" />
          View Golden Resume
        </Button>

        <Button
          variant={getButtonVariant("cover")}
          size="sm"
          onClick={handleCreateCoverLetter}
          className={getButtonClassName("cover")}
        >
          <FileEdit className="h-4 w-4 mr-2" />
          Create Cover Letter
        </Button>

        {job?.job_url ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(job.job_url, "_blank")}
            className="flex items-center gap-2"
          >
            <LinkIcon className="h-4 w-4" />
            Apply Job
          </Button>
        ) : (
          !isAddingJobUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddJobUrl}
              className="flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <ExternalLink className="h-4 w-4" />
              Link JD
            </Button>
          )
        )}
      </div>
    </div>
  );
};

export default AnalysisCard;
