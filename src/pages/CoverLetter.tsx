
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useCoverLetter } from "@/hooks/use-cover-letter";
import { supabase } from "@/integrations/supabase/client";
import CoverLetterEditor from "@/components/cover-letter/CoverLetterEditor";
import JobDescriptionCard from "@/components/cover-letter/JobDescriptionCard";

const CoverLetter = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysisId, setAnalysisId] = useState<string>("");
  const [jobData, setJobData] = useState<any>(null);
  const [isLoadingJob, setIsLoadingJob] = useState(true);

  const {
    jobApplication,
    isLoading,
    isGenerating,
    generateCoverLetter,
    updateCoverLetter,
  } = useCoverLetter(analysisId);

  // Get analysis ID from location state or URL params
  useEffect(() => {
    const id = location.state?.analysisId;
    if (id) {
      setAnalysisId(id);
    } else {
      navigate("/alchemy-records");
    }
  }, [location, navigate]);

  // Fetch job data
  useEffect(() => {
    const fetchJobData = async () => {
      if (!analysisId) return;

      setIsLoadingJob(true);
      try {
        const { data: analysisData, error } = await supabase
          .from("resume_analyses")
          .select(`
            job:job_id (
              job_title,
              company_name,
              job_description,
              job_url,
              company_url
            )
          `)
          .eq("id", analysisId)
          .single();

        if (error) throw error;
        setJobData(analysisData.job);
      } catch (error) {
        console.error("Error fetching job data:", error);
      } finally {
        setIsLoadingJob(false);
      }
    };

    fetchJobData();
  }, [analysisId]);

  const handleBack = () => {
    navigate("/alchemy-records");
  };

  if (!analysisId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Alchemy Records
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Cover Letter</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Job Description - Left Column */}
          <div className="lg:col-span-4">
            <div className="h-fit">
              {isLoadingJob ? (
                <div className="bg-white rounded-xl p-6 shadow-apple">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ) : jobData ? (
                <JobDescriptionCard jobData={jobData} />
              ) : (
                <div className="bg-white rounded-xl p-6 shadow-apple">
                  <p className="text-gray-500">No job description available</p>
                </div>
              )}
            </div>
          </div>

          {/* Cover Letter Editor - Right Columns */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl p-6 shadow-apple">
              <CoverLetterEditor
                coverLetter={jobApplication?.cover_letter}
                isGenerating={isGenerating}
                isLoading={isLoading}
                onGenerate={generateCoverLetter}
                onUpdate={updateCoverLetter}
                jobTitle={jobData?.job_title || ""}
                companyName={jobData?.company_name || ""}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverLetter;
