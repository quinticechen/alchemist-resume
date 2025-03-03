
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useStripeInit } from "@/hooks/useStripeInit";
import { useAuthAndSurvey } from "@/hooks/useAuthAndSurvey";
import { PricingToggle } from "@/components/pricing/PricingToggle";
import { PricingCard } from "@/components/pricing/PricingCard";
import { pricingPlans } from "@/data/pricingPlans";
import { Session } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { trackBeginCheckout } from "@/utils/gtm";

const Pricing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [usageInfo, setUsageInfo] = useState<{
    subscription_status: 'apprentice' | 'alchemist' | 'grandmaster';
    usage_count: number;
    monthly_usage_count: number | null;
    free_trial_limit: number;
  } | null>(null);
  
  const { stripePromise, isStripeInitializing, error: stripeError } = useStripeInit();
  const { isAuthenticated, hasCompletedSurvey } = useAuthAndSurvey();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUsageInfo(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUsageInfo(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (stripeError) {
      console.error('Stripe initialization error:', stripeError);
      toast({
        title: "Payment System Issue",
        description: "There was a problem initializing the payment system. Please try again later.",
        variant: "destructive",
      });
    }
  }, [stripeError, toast]);

  const fetchUsageInfo = async (userId: string) => {
    try {
      console.log('Fetching usage info for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status, usage_count, monthly_usage_count, free_trial_limit')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching usage info:', error);
        return;
      }

      console.log('Usage info fetched:', data);
      setUsageInfo(data);
    } catch (err) {
      console.error('Unexpected error fetching usage info:', err);
    }
  };

  const getRemainingUses = () => {
    if (!usageInfo) return 0;
    
    switch (usageInfo.subscription_status) {
      case 'grandmaster':
        return '∞';
      case 'alchemist':
        return Math.max(0, 30 - (usageInfo.monthly_usage_count || 0));
      default:
        return Math.max(0, usageInfo.free_trial_limit - (usageInfo.usage_count || 0));
    }
  };

  const handlePlanSelection = async (planId: string) => {
    if (!isAuthenticated || !session) {
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
      console.error('Stripe not initialized, current status:', { 
        isInitializing: isStripeInitializing, 
        error: stripeError 
      });
      toast({
        title: "Payment System Error",
        description: "Unable to initialize payment system. Please try again later or contact support.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      trackBeginCheckout(planId, isAnnual);

      // Get a fresh access token
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession?.access_token) {
        throw new Error('No valid access token found. Please log in again.');
      }
      
      const selectedPlan = pricingPlans.find(p => p.planId === planId);
      if (!selectedPlan) {
        throw new Error('Invalid plan selected');
      }
      
      const priceId = isAnnual ? selectedPlan.priceId.annual : selectedPlan.priceId.monthly;
      if (!priceId) {
        throw new Error('No price ID available for the selected plan');
      }

      console.log('Making request to stripe-payment function with:', { planId, priceId, isAnnual });
      
      const { data, error } = await supabase.functions.invoke('stripe-payment', {
        body: { planId, priceId, isAnnual },
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      if (error) {
        console.error('Stripe payment function error:', error);
        throw error;
      }

      if (!data?.sessionUrl) {
        console.error('No checkout URL received from payment function:', data);
        throw new Error('No checkout URL received from payment function');
      }

      console.log('Redirecting to Stripe checkout URL:', data.sessionUrl);
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
    showButton: plan.planId === 'apprentice' ? !isAuthenticated : plan.showButton,
    isCurrentPlan: usageInfo?.subscription_status === plan.planId
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary text-transparent bg-clip-text">
              Choose Your Plan
            </h1>
            <p className="text-xl text-neutral-600 mb-4">
              Select the perfect plan for your career growth
            </p>
            {isAuthenticated && usageInfo && (
              <div className="flex items-center justify-center gap-2 mb-8">
                <Badge variant="outline" className="text-primary border-primary">
                  Current Plan: {usageInfo.subscription_status.charAt(0).toUpperCase() + usageInfo.subscription_status.slice(1)}
                </Badge>
                <Badge variant="outline" className="text-primary border-primary">
                  Remaining Uses: {getRemainingUses()}
                </Badge>
              </div>
            )}
            
            <PricingToggle isAnnual={isAnnual} setIsAnnual={setIsAnnual} />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <PricingCard
                key={plan.planId}
                plan={plan}
                isAnnual={isAnnual}
                isLoading={isLoading || isStripeInitializing}
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
