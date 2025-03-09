
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Predefined feedback options
const QUICK_FEEDBACK_OPTIONS = [
  "Absolutely blown away by how quick and professional the results were. My resume now stands out in all the right ways. This tool is a game-changer!",
  "The transformation was incredible - from basic to brilliant in minutes. Love how it maintained my voice while making everything sound more impactful.",
  "The AI's ability to enhance my resume while keeping my professional identity intact is remarkable. Every change made was thoughtful and purposeful.",
  "Finally found a tool that actually understands how to present my experience effectively. The improvements were spot-on and made my resume much more compelling.",
  "What an incredible tool! It took my basic resume and turned it into something that truly represents my professional journey. Worth every second!",
  "The resume transformation exceeded my expectations. Each section was expertly refined while maintaining authenticity. Exactly what I needed!"
];

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId: string;
  onFeedbackSubmitted: () => void;
}

const FeedbackModal = ({ isOpen, onClose, analysisId, onFeedbackSubmitted }: FeedbackModalProps) => {
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setFeedbackText("");
      setSelectedOption(null);
    }
  }, [isOpen]);

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
  };

  const handleQuickFeedbackSelect = (option: string) => {
    setSelectedOption(option);
    setFeedbackText(option);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Submitting feedback:", {
        analysis_id: analysisId,
        rating,
        feedback_text: feedbackText,
        quick_feedback_option: selectedOption,
      });

      const { error } = await supabase.from("user_feedback").insert({
        analysis_id: analysisId,
        rating,
        feedback_text: feedbackText,
        quick_feedback_option: selectedOption,
      });

      if (error) throw error;

      // Update profile feedback popup count
      await supabase.from("profiles").update({
        feedback_popup_count: 0, // Reset counter after successful feedback
      });

      onFeedbackSubmitted();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Share Your Experience</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-lg font-medium">How would you rate your resume transformation?</label>
            <div className="flex justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1"
                  onClick={() => handleRatingChange(star)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Feedback Options */}
          <div className="space-y-2">
            <label className="text-lg font-medium">Select what best describes your experience:</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {QUICK_FEEDBACK_OPTIONS.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedOption === option ? "default" : "outline"}
                  className="h-auto py-2 px-3 text-left justify-start"
                  onClick={() => handleQuickFeedbackSelect(option)}
                >
                  <span className="line-clamp-2 text-sm">{option}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Feedback Text Area */}
          <div className="space-y-2">
            <label className="text-lg font-medium">Or share your thoughts in your own words:</label>
            <Textarea
              placeholder="Resume Alchemist transformed my boring resume into a masterpiece! The AI understood exactly what I needed and highlighted my achievements perfectly. This is pure magic! 🌟"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
