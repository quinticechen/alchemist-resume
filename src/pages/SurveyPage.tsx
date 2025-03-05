import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SurveyPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const isAnnual = location.state?.isAnnual;
  


  const googleFormUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLScBhsrd96t2TZT-CfJv5yPfyP50L42BYAy2ATJOJsFF5FYOZA/viewform?embedded=true";

  useEffect(() => {
    const getUserEmail = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("has_completed_survey")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }

        if (profile?.has_completed_survey) {
          setSurveyCompleted(true);
        }
      } else {
        navigate("/login");
      }
    };
    getUserEmail();
  }, [navigate]);

  useEffect(() => {
    const checkSurveyCompletion = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("has_completed_survey")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        setIsLoading(false);
        return;
      }

      if (profile?.has_completed_survey) {
        navigate("/alchemist-workshop");
      } else {
        setIsLoading(false);
      }
    };

    checkSurveyCompletion();
  }, [navigate]);

  useEffect(() => {
    const { selectedPlan, isAnnual } = location.state || {};
    if (selectedPlan) {
      setSelectedPlan(selectedPlan);
    }
  }, [location.state]);

  const handleSurveyCompletion = async () => {
    setIsLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    // 更新調查完成狀態
    const { error: surveyError } = await supabase
      .from("profiles")
      .update({ has_completed_survey: true })
      .eq("id", session.user.id);

    if (surveyError) {
      toast({
        title: "Error",
        description: "Failed to update survey status. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    setSurveyCompleted(true);
    toast({
      title: "Thank you!",
      description:
        "Your feedback has been recorded. You now have 3 more free uses available.",
    });
    navigate("/alchemist-workshop");
  };

  const proceedToPayment = async (planId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("stripe-payment", {
        body: { planId, isAnnual },
      });

      if (error) throw error;

      if (!data.sessionUrl) throw new Error("No checkout URL received");

      window.location.href = data.sessionUrl;
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSkipSurvey = () => {
    if (selectedPlan) {
      proceedToPayment(selectedPlan);
    } else {
      toast({
        title: "Error",
        description: "Please select a plan before proceeding.",
        variant: "destructive",
      });
      navigate("/pricing"); // 如果沒有選擇計劃，導航到定價頁面
    }
  };

  const formUrl = userEmail
    ? `${googleFormUrl}&entry.1234567890=${encodeURIComponent(userEmail)}`
    : googleFormUrl;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-primary text-transparent bg-clip-text">
              Feedback Survey
            </h1>
            <p className="text-xl text-neutral-600">
              Help us improve your resume transformation experience
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-apple">
            <h2 className="text-2xl font-semibold mb-4 text-primary">
              Get 3 More Free Uses
            </h2>
            <ul className="space-y-4 text-neutral-600">
              <li className="flex items-start">
                <span className="text-2xl mr-2">✨</span>
                <span>
                  Complete our quick survey to unlock additional free uses
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-2">🎯</span>
                <span>Your feedback helps us improve our service</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-2">⚡</span>
                <span>Takes less than 5 minutes to complete</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-apple">
            <h2 className="text-2xl font-semibold mb-6 text-primary">
              Quick Survey
            </h2>
            <div className="w-full flex justify-center">
              <iframe
                src={formUrl}
                width="100%"
                height="500"
                className="border-0"
                title="Feedback Survey"
              >
                Loading...
              </iframe>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
            <Button
              onClick={handleSurveyCompletion}
              disabled={isLoading}
              className="bg-gradient-primary text-white hover:opacity-90"
            >
              {isLoading ? "Processing..." : "I've Completed the Survey"}
            </Button>
            <Button
              onClick={handleSkipSurvey}
              disabled={isLoading}
              variant="outline"
              className="border-2 border-primary text-primary hover:bg-neutral-50"
            >
              Skip Survey & Purchase Directly
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyPage;
