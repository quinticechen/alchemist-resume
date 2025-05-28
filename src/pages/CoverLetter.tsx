
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useCoverLetter } from "@/hooks/use-cover-letter";
import { supabase } from "@/integrations/supabase/client";
import CoverLetterEditor from "@/components/cover-letter/CoverLetterEditor";
import StatusSelector from "@/components/cover-letter/StatusSelector";
import JobDescriptionViewer from "@/components/alchemy-records/JobDescriptionViewer";

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
    updateStatus,
  } = useCoverLetter(analysisId);

  // Get analysis ID from location state or URL params
  useEffect(() => {
    const id = location.state?.analysisId;
    if (id) {
      setAnalysisId(id);
    } else {
      // If no analysis ID, redirect back to alchemy records
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
              job_url
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job Description - Left Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-apple h-fit">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
              {isLoadingJob ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                </div>
              ) : jobData ? (
                <JobDescriptionViewer jobData={jobData} />
              ) : (
                <p className="text-gray-500">No job description available</p>
              )}
            </div>
          </div>

          {/* Cover Letter Editor - Right Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Selector */}
            <div className="bg-white rounded-xl p-6 shadow-apple">
              <StatusSelector
                currentStatus={jobApplication?.status || "resume"}
                onStatusChange={updateStatus}
                disabled={isLoading}
              />
            </div>

            {/* Cover Letter Editor */}
            <div className="bg-white rounded-xl p-6 shadow-apple">
              <CoverLetterEditor
                coverLetter={jobApplication?.cover_letter}
                isGenerating={isGenerating}
                isLoading={isLoading}
                onGenerate={generateCoverLetter}
                onUpdate={updateCoverLetter}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverLetter;
