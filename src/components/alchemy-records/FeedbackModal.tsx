import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Predefined feedback options
const QUICK_FEEDBACK_OPTIONS = [
  {
    displayText: "Quick and Professional",
    value:
      "Absolutely blown away by how quick and professional the results were. My resume now stands out in all the right ways. This tool is a game-changer!",
  },
  {
    displayText: "Incredible",
    value:
      "The transformation was incredible - from basic to brilliant in minutes. Love how it maintained my voice while making everything sound more impactful.",
  },
  {
    displayText: "Thoughtful",
    value:
      "The AI's ability to enhance my resume while keeping my professional identity intact is remarkable. Every change made was thoughtful and purposeful.",
  },
  {
    displayText: "Actually works",
    value:
      "Finally found a tool that actually understands how to present my experience effectively. The improvements were spot-on and made my resume much more compelling.",
  },
  {
    displayText: "Worth every second",
    value:
      "What an incredible tool! It took my basic resume and turned it into something that truly represents my professional journey. Worth every second!",
  },
  {
    displayText: "Exactly what I needed",
    value:
      "The resume transformation exceeded my expectations. Each section was expertly refined while maintaining authenticity. Exactly what I needed!",
  },
];

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId: string;
  onFeedbackSubmitted: () => void;
}

const FeedbackModal = ({
  isOpen,
  onClose,
  analysisId,
  onFeedbackSubmitted,
}: FeedbackModalProps) => {
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();
  const userId = session?.user?.id;

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

  const handleQuickFeedbackSelect = (option: {
    displayText: string;
    value: string;
  }) => {
    setSelectedOption(option.value); // 使用 option.value 更新 selectedOption
    setFeedbackText(option.value); // 使用 option.value 更新 feedbackText
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

    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to submit feedback.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Submitting feedback:", {
        analysis_id: analysisId,
        user_id: userId,
        rating,
        feedback_text: feedbackText,
        quick_feedback_option: selectedOption,
      });

      const { error } = await supabase.from("user_feedback").insert({
        analysis_id: analysisId,
        user_id: userId,
        rating,
        feedback_text: feedbackText,
        quick_feedback_option: selectedOption,
      });

      if (error) throw error;

      // Update profile feedback popup count
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          feedback_popup_count: 0, // Reset counter after successful feedback
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating profile:", updateError);
      }

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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="bg-white sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Share Your Experience
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-lg font-medium">
              How would you rate your Resume Alchemist experience?
            </label>
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
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Feedback Options */}
          <div className="space-y-2">
            <label className="text-lg font-medium">
              Select what best describes your experience:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {QUICK_FEEDBACK_OPTIONS.map((option, index) => (
                <Button
                  key={index}
                  variant={
                    selectedOption === option.value ? "default" : "outline"
                  } // 使用 option.value 判斷
                  className="h-auto py-2 px-3 text-left justify-start"
                  onClick={() => handleQuickFeedbackSelect(option)}
                >
                  <span className="line-clamp-2 text-sm">
                    {option.displayText}
                  </span>{" "}
                  {/* 顯示 option.displayText */}
                </Button>
              ))}
            </div>
          </div>

          {/* Feedback Text Area */}
          <div className="space-y-2">
            <label className="text-lg font-medium">
              Or share your thoughts in your own words:
            </label>
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
