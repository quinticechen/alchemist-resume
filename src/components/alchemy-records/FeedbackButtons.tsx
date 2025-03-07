
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import FeedbackModal from './FeedbackModal';

interface FeedbackButtonsProps {
  feedback: boolean | null;
  onFeedback: (value: boolean) => void;
  analysisId: string;
}

const FeedbackButtons = ({ feedback, onFeedback, analysisId }: FeedbackButtonsProps) => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  const handleThumbsUp = async () => {
    onFeedback(true);
    
    try {
      // Check if we should show the feedback modal
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('feedback_popup_count')
        .single();
      
      if (error) throw error;
      
      // Increment the feedback popup count
      const updatedCount = (profileData.feedback_popup_count || 0) + 1;
      
      await supabase
        .from('profiles')
        .update({ feedback_popup_count: updatedCount });
      
      // Show feedback modal every 5 thumbs up or on the first thumbs up
      if (updatedCount === 1 || updatedCount % 5 === 0) {
        setShowFeedbackModal(true);
      }
    } catch (error) {
      console.error('Error checking feedback popup count:', error);
    }
  };
  
  const handleModalClose = () => {
    setShowFeedbackModal(false);
  };
  
  const handleFeedbackSubmitted = () => {
    // Additional actions after feedback is submitted if needed
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
          onClick={() => onFeedback(false)}
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
