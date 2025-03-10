
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ResumeAnalysis {
  id: string;
  created_at: string;
  job_url: string;
  job_title: string;
  google_doc_url: string | null;
  feedback: boolean | null;
  resume: {
    file_name: string;
    file_path: string;
  };
}

const ITEMS_PER_PAGE = 10;

export const useAlchemyRecords = () => {
  const [usageCount, setUsageCount] = useState<number>(0);
  const [analyses, setAnalyses] = useState<ResumeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('usage_count')
          .single();

        if (profile) {
          setUsageCount(profile.usage_count || 0);
        }

        const { count } = await supabase
          .from('resume_analyses')
          .select('*', { count: 'exact', head: true });

        if (count) {
          setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
        }

        const { data: analysesData, error } = await supabase
          .from('resume_analyses')
          .select(`
            id,
            created_at,
            job_url,
            job_title,
            google_doc_url,
            feedback,
            resume:resumes!resume_id (
              file_name,
              file_path
            )
          `)
          .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const transformedData: ResumeAnalysis[] = (analysesData || []).map(item => ({
          ...item,
          resume: Array.isArray(item.resume) ? item.resume[0] : item.resume
        }));

        setAnalyses(transformedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  const handleFeedback = async (id: string, value: boolean | null) => {
    try {
      setAnalyses(analyses.map(analysis => 
        analysis.id === id ? { ...analysis, feedback: value } : analysis
      ));

      // Database update is handled in the FeedbackButtons component
    } catch (error) {
      console.error('Error updating feedback:', error);
      toast({
        title: "Error",
        description: "Failed to update feedback",
        variant: "destructive",
      });
    }
  };

  const handleSaveTitle = async (id: string, title: string) => {
    try {
      const { error } = await supabase
        .from('resume_analyses')
        .update({ job_title: title })
        .eq('id', id);

      if (error) throw error;

      setAnalyses(analyses.map(analysis => 
        analysis.id === id ? { ...analysis, job_title: title } : analysis
      ));

      toast({
        title: "Title updated",
        description: "Position name has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating title:', error);
      toast({
        title: "Error",
        description: "Failed to update position name",
        variant: "destructive",
      });
    }
    setEditingId(null);
  };

  return {
    analyses,
    loading,
    currentPage,
    totalPages,
    editingId,
    usageCount,
    setCurrentPage,
    setEditingId,
    handleSaveTitle,
    handleFeedback
  };
};
