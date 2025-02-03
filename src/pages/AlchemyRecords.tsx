import { useEffect, useState } from "react";
import { FileText, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ResumeAnalysis {
  id: string;
  created_at: string;
  job_url: string;
  job_title: string;
  google_doc_url: string | null;
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

        // First, get total count for pagination
        const { count } = await supabase
          .from('resume_analyses')
          .select('*', { count: 'exact', head: true });

        if (count) {
          setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
        }

        // Then fetch paginated data
        const { data: analysesData, error } = await supabase
          .from('resume_analyses')
          .select(`
            id,
            created_at,
            job_url,
            job_title,
            google_doc_url,
            resume:resumes (
              file_name,
              file_path
            )
          `)
          .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAnalyses(analysesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  const downloadResume = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .download(filePath);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-primary text-transparent bg-clip-text">
            Alchemy Records
          </h1>

          {/* Usage Statistics */}
          <div className="bg-white rounded-xl p-6 shadow-apple mb-8">
            <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
            <p className="text-neutral-600">
              Remaining Free Uses: <span className="font-semibold text-primary">{3 - usageCount}</span>
            </p>
          </div>

          {/* Resume History */}
          <div className="space-y-6">
            {analyses.map((analysis) => (
              <div key={analysis.id} className="bg-white rounded-xl p-6 shadow-apple">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      {analysis.job_title || 'Untitled Position'}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-neutral-600">
                  <span>
                    {new Date(analysis.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {analysis.resume?.file_name || 'Unnamed Resume'}
                  </div>
                </div>

                <div className="mt-4 flex gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => analysis.resume?.file_path && downloadResume(analysis.resume.file_path)}
                    className="text-primary border-primary/20 hover:bg-primary/5"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Original Resume
                  </Button>
                  {analysis.google_doc_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(analysis.google_doc_url!, '_blank')}
                      className="text-info border-info/20 hover:bg-info/5"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Golden Resume
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
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