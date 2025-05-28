
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface JobApplication {
  id: string;
  analysis_id: string;
  cover_letter: string | null;
  status: string;
  created_at: string;
  apply_date: string | null;
  note: string | null;
}

export const useCoverLetter = (analysisId: string) => {
  const [jobApplication, setJobApplication] = useState<JobApplication | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Fetch existing job application data
  useEffect(() => {
    const fetchJobApplication = async () => {
      try {
        const { data, error } = await supabase
          .from("job_apply")
          .select("*")
          .eq("analysis_id", analysisId)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        setJobApplication(data);
      } catch (error) {
        console.error("Error fetching job application:", error);
        toast({
          title: "Error",
          description: "Failed to load job application data",
          variant: "destructive",
        });
      }
    };

    if (analysisId) {
      fetchJobApplication();
    }
  }, [analysisId, toast]);

  // Generate cover letter
  const generateCoverLetter = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-cover-letter", {
        body: { analysisId }
      });

      if (error) throw error;

      if (data.success) {
        // Refresh job application data
        const { data: updatedJobApp, error: fetchError } = await supabase
          .from("job_apply")
          .select("*")
          .eq("analysis_id", analysisId)
          .single();

        if (fetchError) throw fetchError;

        setJobApplication(updatedJobApp);
        toast({
          title: "Success",
          description: "Cover letter generated successfully!",
        });
      } else {
        throw new Error(data.error || "Failed to generate cover letter");
      }
    } catch (error) {
      console.error("Error generating cover letter:", error);
      toast({
        title: "Error",
        description: "Failed to generate cover letter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Update cover letter
  const updateCoverLetter = async (newCoverLetter: string) => {
    setIsLoading(true);
    try {
      if (!jobApplication) {
        throw new Error("No job application found");
      }

      const { error } = await supabase
        .from("job_apply")
        .update({ cover_letter: newCoverLetter })
        .eq("id", jobApplication.id);

      if (error) throw error;

      setJobApplication(prev => prev ? { ...prev, cover_letter: newCoverLetter } : null);
      toast({
        title: "Success",
        description: "Cover letter updated successfully!",
      });
    } catch (error) {
      console.error("Error updating cover letter:", error);
      toast({
        title: "Error",
        description: "Failed to update cover letter",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update status
  const updateStatus = async (newStatus: string) => {
    setIsLoading(true);
    try {
      if (!jobApplication) {
        throw new Error("No job application found");
      }

      const { error } = await supabase
        .from("job_apply")
        .update({ status: newStatus })
        .eq("id", jobApplication.id);

      if (error) throw error;

      setJobApplication(prev => prev ? { ...prev, status: newStatus } : null);
      toast({
        title: "Success",
        description: "Status updated successfully!",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    jobApplication,
    isLoading,
    isGenerating,
    generateCoverLetter,
    updateCoverLetter,
    updateStatus,
  };
};
