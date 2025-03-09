import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import FeedbackModal from "./FeedbackModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface FeedbackButtonsProps {
  feedback: boolean | null;
  onFeedback: (value: boolean) => void;
  analysisId: string;
}

const FeedbackButtons = ({
  feedback,
  onFeedback,
  analysisId,
}: FeedbackButtonsProps) => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();
  const userId = session?.user?.id;

  // const handleThumbsUp = async () => {
  //   try {
  //     // First update the feedback in the UI
  //     onFeedback(true);

  //     if (!userId) {
  //       console.error("User ID is not available");
  //       return;
  //     }

  //     console.log("Handling thumbs up for user:", userId);

  //     // Check user profile for feedback popup counter - Fixed query
  //     const { data: profileData, error } = await supabase
  //       .from("profiles")
  //       .select("feedback_popup_count")
  //       .eq("id", userId)
  //       .single();

  //     if (error) {
  //       console.error("Error checking feedback popup count:", error);
  //       return;
  //     }

  //     console.log("Retrieved profile data:", profileData);

  //     // Increment the feedback popup count
  //     const updatedCount = (profileData?.feedback_popup_count || 0) + 1;

  //     // Update the counter in the database
  //     const { error: updateError } = await supabase
  //       .from("profiles")
  //       .update({ feedback_popup_count: updatedCount })
  //       .eq("id", userId);

  //     if (updateError) {
  //       console.error("Error updating feedback count:", updateError);
  //       return;
  //     }

  //     console.log("Feedback count updated:", updatedCount);

  //     // Show feedback modal on first thumbs up or every 5th thumbs up
  //     if (updatedCount === 1 || updatedCount % 5 === 0) {
  //       console.log("Showing feedback modal");
  //       setShowFeedbackModal(true);
  //     }
  //   } catch (error) {
  //     console.error("Error in thumbs up handler:", error);
  //     toast({
  //       title: "Error",
  //       description:
  //         "There was a problem updating your feedback. Please try again.",
  //       variant: "destructive",
  //     });
  //   }
  // };

  const handleThumbsUp = async () => {
    try {
      // 更新 UI 狀態
      const newFeedbackValue = feedback === true ? null : true; // 切換狀態
      onFeedback(newFeedbackValue);

      if (!userId) {
        console.error("User ID is not available");
        return;
      }

      // 使用 transaction 確保兩個更新操作同時成功或失敗
      const { error } = await supabase.transaction(async (trx) => {
        // 更新 resume_analyses 表
        const { error: updateAnalysisError } = await trx
          .from("resume_analyses")
          .update({ feedback: newFeedbackValue })
          .eq("id", analysisId);
        if (updateAnalysisError) {
          throw updateAnalysisError; // 如果更新 resume_analyses 失敗，拋出錯誤
        }

        // 檢查 user profile for feedback popup counter
        const { data: profileData, error: profileError } = await trx
          .from("profiles")
          .select("feedback_popup_count")
          .eq("id", userId)
          .single();
        if (profileError) {
          throw profileError; // 如果查詢 profiles 失敗，拋出錯誤
        }

        // Increment the feedback popup count
        const updatedCount = (profileData?.feedback_popup_count || 0) + 1;

        // 更新 profiles 表
        const { error: updateProfileError } = await trx
          .from("profiles")
          .update({ feedback_popup_count: updatedCount })
          .eq("id", userId);
        if (updateProfileError) {
          throw updateProfileError; // 如果更新 profiles 失敗，拋出錯誤
        }

        // Show feedback modal on first thumbs up or every 5th thumbs up
        if (updatedCount === 1 || updatedCount % 5 === 0) {
          setShowFeedbackModal(true);
        }
      });

      if (error) {
        console.error("Error in transaction:", error);
        toast({
          title: "Error",
          description:
            "There was a problem updating your feedback. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in thumbs up handler:", error);
      toast({
        title: "Error",
        description:
          "There was a problem updating your feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleThumbsDown = () => {
    onFeedback(false);
  };

  const handleModalClose = () => {
    setShowFeedbackModal(false);
  };

  const handleFeedbackSubmitted = () => {
    // Reset modal state after submission
    setShowFeedbackModal(false);

    // Show confirmation toast
    toast({
      title: "Thank You!",
      description: "Your feedback has been submitted successfully.",
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleThumbsUp}
          className={feedback === true ? "text-green-600" : ""}
        >
          <ThumbsUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleThumbsDown}
          className={feedback === false ? "text-red-600" : ""}
        >
          <ThumbsDown className="h-4 w-4" />
        </Button>
      </div>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={handleModalClose}
        analysisId={analysisId}
        onFeedbackSubmitted={handleFeedbackSubmitted}
      />
    </>
  );
};

export default FeedbackButtons;
