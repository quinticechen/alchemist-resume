
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SortOption, StatusFilter } from "@/components/alchemy-records/SortFilterControls";

export interface ResumeAnalysis {
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
  status?: string;
  lastEditTime?: string;
}

const ITEMS_PER_PAGE = 10;

const getStatusOrder = (status: string) => {
  const statusOrder = {
    'resume': 1,
    'cover_letter': 2,
    'application_submitted': 3,
    'following_up': 4,
    'interview': 5,
    'rejected': 6,
    'accepted': 7
  };
  return statusOrder[status as keyof typeof statusOrder] || 0;
};

export const useAlchemyRecords = () => {
  const [usageCount, setUsageCount] = useState<number>(0);
  const [allAnalyses, setAllAnalyses] = useState<ResumeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("created_at_desc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const { toast } = useToast();

  // Sort and filter analyses
  const sortedAndFilteredAnalyses = useMemo(() => {
    let filtered = allAnalyses;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = allAnalyses.filter(analysis => analysis.status === statusFilter);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "created_at_asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "created_at_desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "last_edit_asc":
          const aEditTime = a.lastEditTime ? new Date(a.lastEditTime).getTime() : new Date(a.created_at).getTime();
          const bEditTime = b.lastEditTime ? new Date(b.lastEditTime).getTime() : new Date(b.created_at).getTime();
          return aEditTime - bEditTime;
        case "last_edit_desc":
          const aEditTimeDesc = a.lastEditTime ? new Date(a.lastEditTime).getTime() : new Date(a.created_at).getTime();
          const bEditTimeDesc = b.lastEditTime ? new Date(b.lastEditTime).getTime() : new Date(b.created_at).getTime();
          return bEditTimeDesc - aEditTimeDesc;
        case "status_asc":
          return getStatusOrder(a.status || 'resume') - getStatusOrder(b.status || 'resume');
        case "status_desc":
          return getStatusOrder(b.status || 'resume') - getStatusOrder(a.status || 'resume');
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return sorted;
  }, [allAnalyses, sortOption, statusFilter]);

  // Paginate the sorted and filtered results
  const analyses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sortedAndFilteredAnalyses.slice(startIndex, endIndex);
  }, [sortedAndFilteredAnalyses, currentPage]);

  const totalPages = Math.ceil(sortedAndFilteredAnalyses.length / ITEMS_PER_PAGE);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fix the profiles query to avoid 406 error
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('usage_count')
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else if (profile) {
          setUsageCount(profile.usage_count || 0);
        }

        // Fetch all records with google_doc_url and join with job_apply for status
        const { data: analysesData, error } = await supabase
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
            ),
            job_apply!inner (
              status,
              created_at,
              cover_letter
            ),
            resume_editors (
              updated_at
            )
          `)
          .not('google_doc_url', 'is', null)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform the data
        const transformedData: ResumeAnalysis[] = (analysesData || []).map(item => {
          const resumeData = Array.isArray(item.resume) ? item.resume[0] : item.resume;
          
          let jobData = null;
          if (item.job) {
            if (Array.isArray(item.job) && item.job.length > 0) {
              jobData = item.job[0];
            } else if (typeof item.job === 'object') {
              jobData = item.job;
            }
          }

          // Get status from job_apply
          const jobApply = Array.isArray(item.job_apply) ? item.job_apply[0] : item.job_apply;
          const status = jobApply?.status || 'resume';

          // Determine last edit time
          let lastEditTime = item.created_at;
          if (jobApply?.cover_letter) {
            lastEditTime = jobApply.created_at;
          }
          if (item.resume_editors && item.resume_editors.length > 0) {
            const editorUpdate = item.resume_editors[0].updated_at;
            if (new Date(editorUpdate) > new Date(lastEditTime)) {
              lastEditTime = editorUpdate;
            }
          }

          return {
            id: item.id,
            created_at: item.created_at,
            google_doc_url: item.google_doc_url,
            match_score: item.match_score,
            feedback: item.feedback,
            resume: resumeData,
            job: jobData,
            status,
            lastEditTime
          };
        });

        setAllAnalyses(transformedData);
      } catch (error) {
        console.error('Error fetching alchemy records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset to first page when filter or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortOption, statusFilter]);

  const handleFeedback = async (id: string, value: boolean | null) => {
    try {
      setAllAnalyses(analyses => analyses.map(analysis => 
        analysis.id === id ? { ...analysis, feedback: value } : analysis
      ));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update feedback",
        variant: "destructive",
      });
    }
  };

  const handleSaveTitle = async (id: string, title: string) => {
    try {
      const analysis = allAnalyses.find(a => a.id === id);
      
      if (analysis?.job) {
        const { data, error: jobIdError } = await supabase
          .from('resume_analyses')
          .select('job_id')
          .eq('id', id)
          .single();
        
        if (jobIdError) throw jobIdError;
        
        const jobId = data.job_id;
        
        const { error } = await supabase
          .from('jobs')
          .update({ job_title: title })
          .eq('id', jobId);
        
        if (error) throw error;
        
        setAllAnalyses(analyses => analyses.map(a => {
          if (a.id === id && a.job) {
            return {
              ...a,
              job: {
                ...a.job,
                job_title: title
              }
            };
          }
          return a;
        }));

        toast({
          title: "Title updated",
          description: "Position name has been updated successfully",
        });
      }
    } catch (error) {
      console.error('Error saving title:', error);
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
    sortOption,
    statusFilter,
    setCurrentPage,
    setEditingId,
    setSortOption,
    setStatusFilter,
    handleSaveTitle,
    handleFeedback
  };
};
