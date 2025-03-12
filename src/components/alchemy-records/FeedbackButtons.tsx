
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import FeedbackModal from "./FeedbackModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface FeedbackButtonsProps {
  feedback: boolean | null;
  onFeedback: (value: boolean | null) => void;
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

  // Clear console log of the previous state for debugging
  useEffect(() => {
    // console.log(`Current feedback state for analysis ${analysisId}:`, feedback);
  }, [feedback, analysisId]);

  const handleThumbsUp = async () => {
    try {
      if (!userId) {
        // console.error("User ID is not available");
        toast({
          title: "Error",
          description: "You must be logged in to provide feedback.",
          variant: "destructive",
        });
        return;
      }

      // Toggle the feedback: if it's already true, set to null (cancel), otherwise set to true
      const newFeedbackValue = feedback === true ? null : true;
      
      // First update the UI to make it feel responsive
      onFeedback(newFeedbackValue);

      // console.log(`Setting feedback to ${newFeedbackValue} for analysis ${analysisId}`);

      // Update the feedback in the database
      const { error: updateError } = await supabase
        .from("resume_analyses")
        .update({ feedback: newFeedbackValue })
        .eq("id", analysisId);

      if (updateError) {
        // console.error("Error updating feedback:", updateError);
        // Revert UI change if database update failed
        onFeedback(feedback);
        toast({
          title: "Error",
          description: "Failed to update feedback. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Only show modal and update profile if the new value is true (not when canceling)
      if (newFeedbackValue === true) {
        // Check user profile for feedback popup counter
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("feedback_popup_count")
          .eq("id", userId)
          .single();

        if (error) {
          // console.error("Error checking feedback popup count:", error);
          return;
        }

        // console.log("Retrieved profile data:", profileData);

        // Increment the feedback popup count
        const updatedCount = (profileData?.feedback_popup_count || 0) + 1;

        // Update the counter in the database
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ feedback_popup_count: updatedCount })
          .eq("id", userId);
          
        if (updateError) {
          // console.error("Error updating feedback count:", updateError);
          return;
        }

        console.log("Feedback count updated:", updatedCount);

        // Show feedback modal on first thumbs up or every 5th thumbs up
        if (updatedCount === 1 || updatedCount % 5 === 0) {
          // console.log("Showing feedback modal");
          setShowFeedbackModal(true);
        }
      }

      // Show a toast confirmation
      toast({
        title: newFeedbackValue === true ? "Liked" : "Feedback Removed",
        description: newFeedbackValue === true 
          ? "Thank you for your positive feedback!" 
          : "Your feedback has been removed."
      });
      
    } catch (error) {
      // console.error("Error in thumbs up handler:", error);
      toast({
        title: "Error",
        description:
          "There was a problem updating your feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleThumbsDown = async () => {
    try {
      if (!userId) {
        // console.error("User ID is not available");
        toast({
          title: "Error",
          description: "You must be logged in to provide feedback.",
          variant: "destructive",
        });
        return;
      }

      // Toggle the feedback: if it's already false, set to null (cancel), otherwise set to false
      const newFeedbackValue = feedback === false ? null : false;
      
      // Update the UI first
      onFeedback(newFeedbackValue);

      // console.log(`Setting feedback to ${newFeedbackValue} for analysis ${analysisId}`);

      // Update the feedback in the database
      const { error: updateError } = await supabase
        .from("resume_analyses")
        .update({ feedback: newFeedbackValue })
        .eq("id", analysisId);

      if (updateError) {
        // console.error("Error updating feedback:", updateError);
        // Revert UI change if database update failed
        onFeedback(feedback);
        toast({
          title: "Error",
          description: "Failed to update feedback. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Show a toast confirmation
      toast({
        title: newFeedbackValue === false ? "Disliked" : "Feedback Removed",
        description: newFeedbackValue === false 
          ? "Thank you for your feedback!" 
          : "Your feedback has been removed."
      });
      
    } catch (error) {
      // console.error("Error in thumbs down handler:", error);
      toast({
        title: "Error",
        description:
          "There was a problem updating your feedback. Please try again.",
        variant: "destructive",
      });
    }
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
