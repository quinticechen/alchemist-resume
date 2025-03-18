
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileText, Link as LinkIcon, Crown, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AnalysisTitle from './AnalysisTitle';
import FeedbackButtons from './FeedbackButtons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ResumeEditor from './ResumeEditor';

interface Resume {
  file_name: string;
  file_path: string;
  original_resume: string | null;
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
  golden_resume: string | null;
  match_score: number | null;
  feedback: boolean | null;
  resume: Resume;
  job: Job | null;
  editingId: string | null;
  onStartEditing: (id: string) => void;
  onSaveTitle: (id: string, title: string) => void;
  onCancelEditing: () => void;
  onFeedback: (id: string, value: boolean | null) => void;
}

const AnalysisCard = ({
  id,
  created_at,
  google_doc_url,
  golden_resume,
  match_score,
  feedback,
  resume,
  job,
  editingId,
  onStartEditing,
  onSaveTitle,
  onCancelEditing,
  onFeedback,
}: AnalysisCardProps) => {
  // Get the job title from either the job object or use a default
  const jobTitle = job?.job_title || 'Unnamed Position';
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
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
        </div>
        <FeedbackButtons
          feedback={feedback}
          onFeedback={(value) => onFeedback(id, value)} 
          analysisId={id}
        />
      </div>

      <div className="flex items-center gap-4 text-sm text-neutral-600">
        <span>
          {new Date(created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {resume?.file_name || 'Unnamed Resume'}
        </div>
        {match_score !== null && (
          <div className="font-semibold">
            Match: {Math.round(match_score * 100)}%
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        {job?.job_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(job.job_url, '_blank')}
            className="text-accent-2 border-accent-2/20 hover:bg-accent-2/5"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Job Post
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // First check if we have a file path to the original resume
            if (resume?.file_path) {
              // Get the public URL from Supabase storage
              const { data } = supabase.storage
                .from('resumes')
                .getPublicUrl(resume.file_path);
              
              // Open the original resume document in a new tab
              window.open(data.publicUrl, '_blank');
            } 
            // Fallback to original_resume HTML content if file_path doesn't work
            else if (resume?.original_resume) {
              // Open original resume content in a new tab
              const newTab = window.open();
              if (newTab) {
                newTab.document.write(`<html><head><title>Original Resume</title></head><body>${resume.original_resume}</body></html>`);
                newTab.document.close();
              }
            }
          }}
          className="text-primary border-primary/20 hover:bg-primary/5"
        >
          <FileText className="h-4 w-4 mr-2" />
          Original Resume
        </Button>
        
        {google_doc_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(google_doc_url, '_blank')}
            className="text-info border-info/20 hover:bg-info/5"
          >
            <Crown className="h-4 w-4 mr-2" />
            Golden Resume
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditorOpen(true)}
          className="text-success border-success/20 hover:bg-success/5"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit Resume
        </Button>
      </div>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Resume Editor - {jobTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ResumeEditor 
              resumeId={resume?.file_path} 
              goldenResume={golden_resume}
              analysisId={id}
              onClose={() => setIsEditorOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnalysisCard;
