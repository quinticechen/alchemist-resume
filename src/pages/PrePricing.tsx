
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PrePricing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const googleFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLScBhsrd96t2TZT-CfJv5yPfyP50L42BYAy2ATJOJsFF5FYOZA/viewform?embedded=true";

  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('has_completed_survey')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        if (profile?.has_completed_survey) {
          setSurveyCompleted(true);
        }
      } else {
        navigate('/login');
      }
    };
    getUserEmail();
  }, [navigate]);

  const handleSurveyCompletion = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ has_completed_survey: true })
      .eq('id', session.user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update survey status. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setSurveyCompleted(true);
    toast({
      title: "Thank you!",
      description: "Your feedback has been recorded. You can now continue using our services.",
    });
  };

  // Construct form URL with email parameter if available
  const formUrl = userEmail 
    ? `${googleFormUrl}&entry.1234567890=${encodeURIComponent(userEmail)}`
    : googleFormUrl;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Thank You Message */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-primary text-transparent bg-clip-text">
              Thank You for Your Interest!
            </h1>
            <p className="text-xl text-neutral-600">
              We're excited to help you transform your resume into a perfectly matched job application.
            </p>
          </div>

          {/* Value Proposition */}
          <div className="bg-white rounded-xl p-8 shadow-apple">
            <h2 className="text-2xl font-semibold mb-4 text-primary">
              Why Choose ResumeAlchemist?
            </h2>
            <ul className="space-y-4 text-neutral-600">
              <li className="flex items-start">
                <span className="text-2xl mr-2">✨</span>
                <span>Customized resumes perfectly matched to specific job requirements</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-2">🎁</span>
                <span>Start with 3 free uses to experience our powerful AI-driven customization</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-2">⚡</span>
                <span>Quick and efficient resume transformation process</span>
              </li>
            </ul>
          </div>

          {/* Survey Section */}
          <div className="bg-white rounded-xl p-8 shadow-apple">
            <h2 className="text-2xl font-semibold mb-6 text-primary">
              Help Us Serve You Better
            </h2>
            <div className="w-full flex justify-center">
              <iframe
                src={formUrl}
                width="100%"
                height="500"
                className="border-0"
                title="Feedback Form"
              >
                Loading...
              </iframe>
            </div>
          </div>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
            <Button
              onClick={handleSurveyCompletion}
              className="bg-gradient-primary text-white hover:opacity-90"
            >
              I've Completed the Survey
            </Button>
            <Button
              onClick={() => navigate("/alchemist-workshop")}
              className="bg-white border-2 border-primary text-primary hover:bg-neutral-50"
              disabled={!surveyCompleted}
            >
              Return to Workshop
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrePricing;
