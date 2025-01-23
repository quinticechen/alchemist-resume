import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AlchemistSectionProps {
  resumeId?: string;
}

const AlchemistSection = ({ resumeId }: AlchemistSectionProps) => {
  const { toast } = useToast();
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!resumeId) return;

      try {
        const { data, error } = await supabase
          .from("resume_analyses")
          .select("google_doc_url")
          .eq("resume_id", resumeId)
          .maybeSingle();

        if (error) throw error;
        
        if (data?.google_doc_url) {
          setGoogleDocUrl(data.google_doc_url);
        }
      } catch (error) {
        console.error("Error fetching analysis:", error);
        toast({
          title: "Error",
          description: "Failed to fetch analysis results",
          variant: "destructive",
        });
      }
    };

    fetchAnalysis();
  }, [resumeId, toast]);

  const handleDownload = async () => {
    if (!resumeId) {
      toast({
        title: "Error",
        description: "No resume found to download",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: resume } = await supabase
        .from("resumes")
        .select("file_path, file_name")
        .eq("id", resumeId)
        .single();

      if (!resume) {
        throw new Error("Resume not found");
      }

      const { data, error } = await supabase.storage
        .from("resumes")
        .download(resume.file_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = resume.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Resume downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading resume:", error);
      toast({
        title: "Error",
        description: "Failed to download resume",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          ResumeAlchemist Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Your resume has been processed. You can download the original file or view the enhanced version below.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDownload}
              className="w-full sm:w-auto"
              variant="default"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Original
            </Button>
            {googleDocUrl && (
              <Button
                onClick={() => window.open(googleDocUrl, '_blank')}
                className="w-full sm:w-auto"
                variant="outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Enhanced Resume
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlchemistSection;