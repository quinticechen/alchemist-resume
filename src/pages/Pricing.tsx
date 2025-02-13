
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const Pricing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedSurvey, setHasCompletedSurvey] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAuthAndSurveyStatus();
  }, []);

  const checkAuthAndSurveyStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);

    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('has_completed_survey')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setHasCompletedSurvey(profile.has_completed_survey || false);
      }
    }
  };

  const handlePlanSelection = async (planId: string) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/pricing" } });
      return;
    }

    if (!hasCompletedSurvey) {
      navigate("/survey-page", { state: { selectedPlan: planId, isAnnual } });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('stripe-payment', {
        body: { planId, isAnnual },
      });

      if (error) {
        console.error('Payment function error:', error);
        throw new Error(error.message || 'Failed to initiate payment');
      }

      if (!data?.sessionUrl) {
        throw new Error('No checkout URL received');
      }

      window.location.href = data.sessionUrl;
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    {
      name: "Apprentice",
      planId: "apprentice",
      price: {
        monthly: "$0",
        annual: "$0",
      },
      features: [
        "3 Resume Customizations",
        "Basic AI Analysis",
        "PDF Format Support",
      ],
      buttonText: "Start Free Trial",
      highlighted: false,
      showButton: !isAuthenticated,
    },
    {
      name: "Alchemist",
      planId: "alchemist",
      price: {
        monthly: "$39.99",
        annual: "$359.99",
      },
      features: [
        "Everything in Apprentice plan",
        "30 uses per Month",
        "Advanced AI Analysis",
        "Multiple Resume Versions",
        "Resume Performance Analytics",
      ],
      buttonText: "Get Alchemist",
      highlighted: false,
      showButton: true,
    },
    {
      name: "Grandmaster",
      planId: "grandmaster",
      price: {
        monthly: "$99.99",
        annual: "$899.99",
      },
      features: [
        "Everything in Alchemist plan",
        "Unlimited uses",
        "Interview Tips",
        "Priority Support",
        "Early access to new features",
      ],
      buttonText: "Get Grandmaster",
      highlighted: true,
      showButton: true,
      mostPopular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary text-transparent bg-clip-text">
              Choose Your Plan
            </h1>
            <p className="text-xl text-neutral-600 mb-8">
              Select the perfect plan for your career growth
            </p>
            
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-lg ${!isAnnual ? 'text-primary font-semibold' : 'text-neutral-600'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative w-16 h-8 rounded-full transition-colors ${
                  isAnnual ? 'bg-primary' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform transform ${
                    isAnnual ? 'translate-x-8' : ''
                  }`}
                />
              </button>
              <span className={`text-lg ${isAnnual ? 'text-primary font-semibold' : 'text-neutral-600'}`}>
                Annual
              </span>
              {isAnnual ? (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                  Save 25%
                </span>
              ) : (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                  Switch to annual plan to save 25%
                </span>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.planId}
                className={`rounded-xl p-8 relative ${
                  plan.highlighted
                    ? "bg-gradient-primary text-white ring-2 ring-primary"
                    : "bg-white"
                }`}
              >
                {plan.mostPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold">
                    {isAnnual ? plan.price.annual : plan.price.monthly}
                  </span>
                  <span className="text-lg ml-1">
                    {plan.price.monthly !== "$0" && `/${isAnnual ? 'year' : 'month'}`}
                  </span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <Check className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.showButton && (
                  <Button
                    onClick={() => handlePlanSelection(plan.planId)}
                    disabled={isLoading}
                    className={`w-full ${
                      plan.highlighted
                        ? "bg-white text-primary hover:bg-neutral-100"
                        : "bg-gradient-primary text-white hover:opacity-90"
                    }`}
                  >
                    {isLoading ? "Processing..." : plan.buttonText}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
