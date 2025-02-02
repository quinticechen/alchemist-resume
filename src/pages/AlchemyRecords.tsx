import { useEffect, useState } from "react";
import { FileText, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface ResumeAnalysis {
  id: string;
  created_at: string;
  job_url: string;
  job_title: string;
  job_company: string;
  match_score: number;
  resume: {
    file_name: string;
    file_path: string;
  };
}

const AlchemyRecords = () => {
  const [usageCount, setUsageCount] = useState<number>(0);
  const [analyses, setAnalyses] = useState<ResumeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

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

        const { data: analysesData, error } = await supabase
          .from('resume_analyses')
          .select(`
            id,
            created_at,
            job_url,
            job_title,
            job_company,
            match_score,
            resume:resumes (
              file_name,
              file_path
            )
          `)
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
  }, []);

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
                    <p className="text-neutral-600">{analysis.job_company || 'Company Not Specified'}</p>
                  </div>
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                    Match Score: {analysis.match_score || 'N/A'}%
                  </span>
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
                    Download Resume
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(analysis.job_url, '_blank')}
                    className="text-info border-info/20 hover:bg-info/5"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    View Job Post
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlchemyRecords;