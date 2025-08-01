import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ResumeSelectorProps {
  onSelect: (resumeId: string, resumeName: string, resumePath: string, resumeContent: string) => void;
  className?: string;
}

const ResumeSelector: React.FC<ResumeSelectorProps> = ({
  onSelect,
  className = "",
}) => {
  const { session } = useAuth();
  const [resumes, setResumes] = useState<
    Array<{
      id: string;
      file_name: string;
      file_path: string;
      created_at: string;
    }>
  >([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchResumes = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("resumes")
          .select("id, file_name, file_path, created_at")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setResumes(data || []);
      } catch (error) {
        console.error("Error fetching resumes:", error);
        toast({
          title: "Error",
          description: "Failed to load your resumes. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchResumes();
  }, [toast, session?.user?.id]);

  const handleSelect = async () => {
    if (!selectedResumeId) {
      toast({
        title: "No Resume Selected",
        description: "Please select a resume to continue.",
        variant: "destructive",
      });
      return;
    }

    const selectedResume = resumes.find(
      (resume) => resume.id === selectedResumeId
    );
    if (selectedResume) {
      try {
        // Fetch the resume content from the database
        const { data: resumeData, error } = await supabase
          .from("resumes")
          .select("formatted_resume")
          .eq("id", selectedResumeId)
          .single();

        if (error) {
          console.error("Error fetching resume content:", error);
          toast({
            title: "Error",
            description: "Failed to load resume content. Please try again.",
            variant: "destructive",
          });
          return;
        }

        onSelect(
          selectedResume.id,
          selectedResume.file_name,
          selectedResume.file_path,
          resumeData.formatted_resume || ""
        );
      } catch (error) {
        console.error("Error selecting resume:", error);
        toast({
          title: "Error",
          description: "Failed to select resume. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const previewSelectedResume = () => {
    if (!selectedResumeId) {
      toast({
        title: "No Resume Selected",
        description: "Please select a resume first to preview.",
        variant: "destructive",
      });
      return;
    }

    const selectedResume = resumes.find(
      (resume) => resume.id === selectedResumeId
    );
    if (selectedResume) {
      const { data } = supabase.storage
        .from("resumes")
        .getPublicUrl(selectedResume.file_path);

      window.open(data.publicUrl, "_blank");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div>
      {isLoading ? (
        <div className="text-center py-4">Loading your resumes...</div>
      ) : resumes.length === 0 ? (
        <div className="text-center py-4 text-neutral-600">
          <FileText className="h-12 w-12 mx-auto text-neutral-400 mb-2" />
          <p>You haven't uploaded any resumes yet.</p>
        </div>
      ) : (
        <>
          <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Select a resume" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {resumes.map((resume) => (
                <SelectItem
                  key={resume.id}
                  value={resume.id}
                  className="cursor-pointer"
                >
                  {resume.file_name} - {formatDate(resume.created_at)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
            {selectedResumeId && (
              <Button
                onClick={previewSelectedResume}
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview Resume
              </Button>
            )}

            <Button
              onClick={handleSelect}
              className="w-full bg-primary hover:bg-primary-dark flex items-center justify-center gap-2"
              disabled={!selectedResumeId}
            >
              <FileText className="h-4 w-4" />
              Use Selected Resume
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ResumeSelector;
