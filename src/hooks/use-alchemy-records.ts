
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ResumeAnalysis {
  id: string;
  created_at: string;
  google_doc_url: string | null;
  golden_resume: string | null;
  match_score: number | null;
  feedback: boolean | null;
  resume: {
    file_name: string;
    file_path: string;
    original_resume: string | null;
  };
  job: {
    job_title: string;
    company_name: string | null;
    company_url: string | null;
    job_url: string | null; // Add job_url from jobs table
  } | null;
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

        // Count only records with google_doc_url
        const { count } = await supabase
          .from('resume_analyses')
          .select('*', { count: 'exact', head: true })
          .not('google_doc_url', 'is', null);

        if (count) {
          setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
        }

        // Fetch only records with google_doc_url
        // Updated to include job_url from the jobs table
        const { data: analysesData, error } = await supabase
          .from('resume_analyses')
          .select(`
            id,
            created_at,
            google_doc_url,
            golden_resume,
            match_score,
            feedback,
            job:job_id (
              job_title,
              company_name,
              company_url,
              job_url
            ),
            resume:resumes!resume_id (
              file_name,
              file_path,
              original_resume
            )
          `)
          .not('google_doc_url', 'is', null)
          .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform the data to ensure job is properly handled
        const transformedData: ResumeAnalysis[] = (analysesData || []).map(item => {
          // Ensure resume is an object and not an array
          const resumeData = Array.isArray(item.resume) ? item.resume[0] : item.resume;
          
          // Handle job data - it might be null, an array with one item, or an object
          let jobData = null;
          if (item.job) {
            // If job is an array with items, use the first one
            if (Array.isArray(item.job) && item.job.length > 0) {
              jobData = item.job[0];
            } 
            // If job is already an object, use it directly
            else if (typeof item.job === 'object') {
              jobData = item.job;
            }
          }

          return {
            id: item.id,
            created_at: item.created_at,
            google_doc_url: item.google_doc_url,
            golden_resume: item.golden_resume,
            match_score: item.match_score,
            feedback: item.feedback,
            resume: Array.isArray(item.resume) ? item.resume[0] : item.resume,
            job: Array.isArray(item.job) && item.job.length > 0 
              ? item.job[0] 
              : (typeof item.job === 'object' ? item.job : null)
          };
        });

        setAnalyses(transformedData);
      } catch (error) {
        // Error handling
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
      // console.error('Error updating feedback:', error);
      toast({
        title: "Error",
        description: "Failed to update feedback",
        variant: "destructive",
      });
    }
  };

  const handleSaveTitle = async (id: string, title: string) => {
    try {
      // Get the analysis to find the job_id
      const analysis = analyses.find(a => a.id === id);
      
      if (analysis?.job) {
        // If we have a job associated with this analysis, update the job title
        const { error } = await supabase
          .from('jobs')
          .update({ job_title: title })
          .eq('id', analysis.job.job_title);
          
        if (error) throw error;
      }

      // Update the local state
      setAnalyses(analyses.map(analysis => {
        if (analysis.id === id && analysis.job) {
          return {
            ...analysis,
            job: {
              ...analysis.job,
              job_title: title
            }
          };
        }
        return analysis;
      }));

      toast({
        title: "Title updated",
        description: "Position name has been updated successfully",
      });
    } catch (error) {
      // console.error('Error updating title:', error);
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
