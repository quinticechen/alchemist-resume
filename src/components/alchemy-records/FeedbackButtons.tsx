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
  const { session } = useAuth(); // 使用 useAuth
  const userId = session?.user?.id; // 取得 user_id

  const handleThumbsUp = async () => {
    try {
      // First update the feedback in the UI
      onFeedback(true);

      // Check user profile for feedback popup counter
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("feedback_popup_count")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error checking feedback popup count:", error);
        return;
      }

      // Increment the feedback popup count
      const updatedCount = (profileData?.feedback_popup_count || 0) + 1;

      // Update the counter in the database
      await supabase
        .from("profiles")
        .update({ feedback_popup_count: updatedCount });
        .eq("user_id", userId)

      console.log("Feedback count updated:", updatedCount);

      // Show feedback modal on first thumbs up or every 5th thumbs up
      if (updatedCount === 1 || updatedCount % 5 === 0) {
        console.log("Showing feedback modal");
        setShowFeedbackModal(true);
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

      {/* Ensure the FeedbackModal gets rendered with the correct props */}
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
