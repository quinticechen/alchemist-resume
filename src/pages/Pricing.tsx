
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useStripeInit } from "@/hooks/useStripeInit";
import { useAuthAndSurvey } from "@/hooks/useAuthAndSurvey";
import { PricingToggle } from "@/components/pricing/PricingToggle";
import { PricingCard } from "@/components/pricing/PricingCard";
import { pricingPlans } from "@/data/pricingPlans";

const Pricing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { isStripeInitializing, stripePromise } = useStripeInit();
  const { isAuthenticated, hasCompletedSurvey } = useAuthAndSurvey();

  const handlePlanSelection = async (planId: string) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/pricing" } });
      return;
    }

    if (!hasCompletedSurvey) {
      navigate("/survey-page", { state: { selectedPlan: planId, isAnnual } });
      return;
    }

    if (isStripeInitializing) {
      toast({
        title: "Please Wait",
        description: "Payment system is initializing. Please try again in a moment.",
      });
      return;
    }

    if (!stripePromise) {
      toast({
        title: "Payment System Error",
        description: "Unable to initialize payment system. Please ensure you have set up your Stripe configuration.",
        variant: "destructive",
      });
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

  const plans = pricingPlans.map(plan => ({
    ...plan,
    showButton: plan.planId === 'apprentice' ? !isAuthenticated : plan.showButton
  }));

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
            
            <PricingToggle isAnnual={isAnnual} setIsAnnual={setIsAnnual} />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <PricingCard
                key={plan.planId}
                plan={plan}
                isAnnual={isAnnual}
                isLoading={isLoading}
                onSelect={handlePlanSelection}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
