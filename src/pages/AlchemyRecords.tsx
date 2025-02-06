import { useEffect, useState } from "react";
import { FileText, Eye, ThumbsUp, ThumbsDown, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
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
  const [editingTitle, setEditingTitle] = useState("");
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

  const startEditing = (analysis: ResumeAnalysis) => {
    setEditingId(analysis.id);
    setEditingTitle(analysis.job_title || '');
  };

  const saveTitle = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('resume_analyses')
        .update({ job_title: editingTitle })
        .eq('id', editingId);

      if (error) throw error;

      setAnalyses(analyses.map(analysis => 
        analysis.id === editingId ? { ...analysis, job_title: editingTitle } : analysis
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-primary text-transparent bg-clip-text">
            Alchemy Records
          </h1>

          <div className="bg-white rounded-xl p-6 shadow-apple mb-8">
            <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
            <p className="text-neutral-600">
              Remaining Free Uses: <span className="font-semibold text-primary">{3 - usageCount}</span>
            </p>
          </div>

          <div className="space-y-6">
            {analyses.map((analysis) => (
              <div key={analysis.id} className="bg-white rounded-xl p-6 shadow-apple">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    {editingId === analysis.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="max-w-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={saveTitle}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {analysis.job_title || 'Untitled Position'}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(analysis)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFeedback(analysis.id, true)}
                      className={analysis.feedback === true ? "text-green-600" : ""}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFeedback(analysis.id, false)}
                      className={analysis.feedback === false ? "text-red-600" : ""}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
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
                    onClick={() => {
                      if (analysis.resume?.file_path) {
                        const { data } = supabase.storage
                          .from('resumes')
                          .getPublicUrl(analysis.resume.file_path);
                        window.open(data.publicUrl, '_blank');
                      }
                    }}
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