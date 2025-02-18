
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import UsageStats from "@/components/alchemy-records/UsageStats";
import AnalysisCard from "@/components/alchemy-records/AnalysisCard";

interface ResumeAnalysis {
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

const AlchemyRecords = () => {
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

        // Transform the data to match our expected type
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

  const handleFeedback = async (id: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('resume_analyses')
        .update({ feedback: value })
        .eq('id', id);

      if (error) throw error;

      setAnalyses(analyses.map(analysis => 
        analysis.id === id ? { ...analysis, feedback: value } : analysis
      ));

      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      });
    } catch (error) {
      console.error('Error updating feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback",
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-primary text-transparent bg-clip-text">
            Alchemy Records
          </h1>

          <UsageStats usageCount={usageCount} />

          <div className="space-y-6">
            {analyses.map((analysis) => (
              <AnalysisCard
                key={analysis.id}
                {...analysis}
                editingId={editingId}
                onStartEditing={setEditingId}
                onSaveTitle={handleSaveTitle}
                onCancelEditing={() => setEditingId(null)}
                onFeedback={handleFeedback}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlchemyRecords;
