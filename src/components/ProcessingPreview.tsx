import React, { useEffect, useState } from "react";
import { History, Crown, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Lottie from "react-lottie";
import Loading from "@/animations/Loading.json";
import Failed from "@/animations/Failed.json";

interface ProcessingPreviewProps {
  analysisId: string;
  jobUrl?: string;
  isProcessing?: boolean;
  setIsProcessing?: (isProcessing: boolean) => void;
  onGenerationComplete?: () => void;
  isTimeout?: boolean;
}

type ProcessingStatus = "pending" | "error" | "timeout" | "success";

// Define an interface for the data shape we expect from Supabase
interface AnalysisData {
  google_doc_url: string | null;
  match_score: number | null;
  error: string | null;
  status: ProcessingStatus | null;
  formatted_golden_resume: any;
}

const ProcessingPreview = ({
  analysisId,
  jobUrl,
  isProcessing,
  setIsProcessing,
  onGenerationComplete,
  isTimeout = false,
}: ProcessingPreviewProps) => {
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>(isTimeout ? "timeout" : "pending");
  const [error, setError] = useState<string | null>(null);
  const [formattedGoldenResume, setFormattedGoldenResume] = useState<any | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Animation configuration options
  const loadingOptions = {
    loop: true,
    autoplay: true,
    animationData: Loading,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const failedOptions = {
    loop: true,
    autoplay: true,
    animationData: Failed,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  // Reset state when analysisId changes
  useEffect(() => {
    setGoogleDocUrl(null);
    setMatchScore(null);
    setStatus(isTimeout ? "timeout" : "pending");
    setError(null);
    setFormattedGoldenResume(null);
  }, [analysisId, isTimeout]);

  // Debugging log
  useEffect(() => {
    if (analysisId) {
      console.log(`ProcessingPreview: Monitoring analysis ${analysisId} with status ${status}`);
    }
  }, [analysisId, status]);

  // Set up subscription and initial fetch
  useEffect(() => {
    if (!analysisId) return;
    
    let channel: RealtimeChannel;
    
    // 設置初始狀態和監聽分析結果
    setProcessingState({
      status: status || 'processing',
      message: 'Optimizing your resume...',
      progress: 0
    });
    
    const fetchAnalysisData = async () => {
      if (!analysisId) return;
      
      try {
        const { data, error } = await supabase
          .from('resume_analyses')
          .select('*')
          .eq('id', analysisId)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setAnalysisData(data);
          
          if (data.status === 'success' && data.google_doc_url) {
            setProcessingState({
              status: 'success',
              message: 'Resume optimized successfully!',
              progress: 100
            });
          } else if (data.status === 'error') {
            setProcessingState({
              status: 'error',
              message: data.error_message || 'Failed to process your resume.',
              progress: 0
            });
          } else if (data.status === 'timeout') {
            setProcessingState({
              status: 'timeout',
              message: 'Resume processing timed out. Please try again.',
              progress: 0
            });
          }
        } else {
          setProcessingState({
            status: 'error',
            message: 'Analysis not found',
            progress: 0
          });
        }
      } catch (error) {
        setProcessingState({
          status: 'error',
          message: 'Failed to retrieve analysis status',
          progress: 0
        });
      }
    };
    
    fetchAnalysisData();
    
    // 訂閱實時更新
    const setupRealtimeSubscription = async () => {
      channel = supabase
        .channel(`analysis-${analysisId}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'resume_analyses',
          filter: `id=eq.${analysisId}`
        }, (payload) => {
          const updatedAnalysis = payload.new as ResumeAnalysis;
          setAnalysisData(updatedAnalysis);
          
          if (updatedAnalysis.status === 'error') {
            setProcessingState({
              status: 'error',
              message: updatedAnalysis.error_message || 'Failed to process your resume.',
              progress: 0
            });
          } else if (updatedAnalysis.status === 'timeout') {
            setProcessingState({
              status: 'timeout',
              message: 'Resume processing timed out. Please try again.',
              progress: 0
            });
          } else if (updatedAnalysis.status === 'success' && updatedAnalysis.google_doc_url) {
            setProcessingState({
              status: 'success',
              message: 'Resume optimized successfully!',
              progress: 100
            });
          } else if (updatedAnalysis.progress) {
            setProcessingState(prev => ({
              ...prev,
              progress: updatedAnalysis.progress || prev.progress
            }));
          }
        })
        .subscribe();
    };
    
    setupRealtimeSubscription();
    
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [analysisId, supabase, status]);

  // Navigate to resume preview
  const handleViewGoldenResume = () => {
    navigate('/resume-preview', { 
      state: { analysisId }
    });
  };

  // Always render the component based on status
  return (
    <div className="w-full text-center mt-4">
      <div className="text-xl flex flex-col items-center">
        {status === "pending" && (
          <div className="py-8">
            <div className="w-64 h-64 mx-auto">
              <Lottie options={loadingOptions} />
            </div>
            <p className="mt-4 text-gray-600">
              Your resume is being alchemized. Please wait a few minutes...
            </p>
          </div>
        )}

        {(status === "error" || status === "timeout") && (
          <div className="py-8">
            <div className="w-64 h-64 mx-auto">
              <Lottie options={failedOptions} />
            </div>
            <p className="mt-4 text-gray-600">
              {status === "timeout"
                ? "Resume generation took too long. Please try again later."
                : error || "An error occurred during processing."}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {status === "success" && (
          <div className="flex text-center flex-wrap gap-3 pt-2 justify-center">
            {googleDocUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(googleDocUrl, "_blank")}
                className="text-accent-1 border-accent-1/20 hover:bg-accent-2/5"
              >
                <FileText className="h-4 w-4 mr-2" />
                Edit with Google Doc
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleViewGoldenResume}
              className="text-yellow-600 border-yellow-600/20 hover:bg-yellow-50"
            >
              <Crown className="h-4 w-4 mr-2" />
              View Golden Resume
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/alchemy-records")}
              className="text-primary border-primary/20 hover:bg-primary/5"
            >
              <History className="h-4 w-4 mr-2" />
              View All Records
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingPreview;
