import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase, getEnvironment } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useStripeInit } from "@/hooks/useStripeInit";
import { useAuthAndSurvey } from "@/hooks/useAuthAndSurvey";
import { PricingToggle } from "@/components/pricing/PricingToggle";
import { PricingCard } from "@/components/pricing/PricingCard";
import { pricingPlans, getPriceId } from "@/data/pricingPlans";
import { Session } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { trackBeginCheckout } from "@/utils/gtm";
import SeekerDialog from "@/components/SeekerDialog";

interface SubscriptionInfo {
  subscription_status: "apprentice" | "alchemist" | "grandmaster";
  payment_period?: "monthly" | "annual";
  usage_count: number;
  monthly_usage_count: number | null;
  free_trial_limit: number;
}

const Pricing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [usageInfo, setUsageInfo] = useState<SubscriptionInfo | null>(null);

  const {
    stripePromise,
    isStripeInitializing,
    error: stripeError,
  } = useStripeInit();
  const { isAuthenticated, hasCompletedSurvey } = useAuthAndSurvey();

  const stripeBuyButtonRef = useRef<HTMLDivElement>(null);

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
      console.error("Stripe initialization error:", stripeError);
      toast({
        title: "Payment System Issue",
        description:
          "There was a problem initializing the payment system. Please try again later.",
        variant: "destructive",
      });
    }
  }, [stripeError, toast]);

  useEffect(() => {
    if (stripeBuyButtonRef.current) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/buy-button.js';
      script.async = true;
      
      if (!document.querySelector('script[src="https://js.stripe.com/v3/buy-button.js"]')) {
        document.body.appendChild(script);
      }
    }
  }, []);

  const fetchUsageInfo = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "subscription_status, usage_count, monthly_usage_count, free_trial_limit, payment_period"
        )
        .eq("id", userId)
        .single();

      if (profileError) {
        return;
      }
      
      setUsageInfo(profileData);
      
      if (profileData.payment_period === 'annual') {
        setIsAnnual(true);
      }
    } catch (err) {
    }
  };

  const getRemainingUses = () => {
    if (!usageInfo) return 0;

    switch (usageInfo.subscription_status) {
      case "grandmaster":
        return "∞";
      case "alchemist":
        return Math.max(0, 30 - (usageInfo.monthly_usage_count || 0));
      default:
        return Math.max(
          0,
          usageInfo.free_trial_limit - (usageInfo.usage_count || 0)
        );
    }
  };

  const handlePlanSelection = async (planId: string) => {
    if (!isAuthenticated || !session) {
      navigate("/login", { state: { from: "/pricing" } });
      return;
    }

    if (hasCompletedSurvey === null) {
      navigate("/survey-page", { state: { selectedPlan: planId, isAnnual } });
      return;
    }

    if (isStripeInitializing) {
      toast({
        title: "Please Wait",
        description:
          "Payment system is initializing. Please try again in a moment.",
      });
      return;
    }

    if (!stripePromise) {
      console.error("Stripe not initialized, current status:", {
        isInitializing: isStripeInitializing,
        error: stripeError,
      });
      toast({
        title: "Payment System Error",
        description:
          "Unable to initialize payment system. Please try again later or contact support.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      trackBeginCheckout(planId, isAnnual);

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession?.access_token) {
        throw new Error("No valid access token found. Please log in again.");
      }

      const selectedPlan = pricingPlans.find((p) => p.planId === planId);
      if (!selectedPlan) {
        throw new Error("Invalid plan selected");
      }

      const priceId = getPriceId(selectedPlan, isAnnual);
      
      if (!priceId) {
        throw new Error("No price ID available for the selected plan");
      }

      const environment = getEnvironment();
      console.log(`Creating Stripe checkout session in ${environment} environment`);
      
      let retryCount = 0;
      const maxRetries = 2;
      let lastError = null;
      
      while (retryCount <= maxRetries) {
        try {
          const { data, error } = await supabase.functions.invoke(
            "stripe-payment",
            {
              body: { planId, priceId, isAnnual },
              headers: {
                Authorization: `Bearer ${currentSession.access_token}`,
                'x-environment': environment,
              },
            }
          );

          if (error) {
            console.error(`Attempt ${retryCount + 1} failed:`, error);
            lastError = error;
            retryCount++;
            
            if (retryCount <= maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              continue;
            }
            throw error;
          }

          if (!data?.sessionUrl) {
            throw new Error("No checkout URL received from payment function");
          }

          window.location.href = data.sessionUrl;
          return;
        } catch (err) {
          console.error(`Attempt ${retryCount + 1} error:`, err);
          lastError = err;
          retryCount++;
          
          if (retryCount <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          } else {
            break;
          }
        }
      }
      
      throw lastError || new Error("Failed to create checkout session after multiple attempts");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to initiate payment. Please try again.";
      console.error("Payment error details:", error);
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentPlan = (planId: string, planIsAnnual: boolean) => {
    if (!usageInfo) return false;
    
    const tierMatch = usageInfo.subscription_status === planId;
    
    if (!tierMatch) return false;
    
    if (planId === 'apprentice') return true;
    
    const periodMatch = planIsAnnual ? 
      usageInfo.payment_period === 'annual' : 
      usageInfo.payment_period === 'monthly';
      
    return tierMatch && periodMatch;
  };

  const plans = pricingPlans.map((plan) => ({
    ...plan,
    showButton:
      plan.planId === "apprentice" ? !isAuthenticated : plan.showButton,
    isCurrentPlan: isCurrentPlan(plan.planId, isAnnual),
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
                <Badge
                  variant="outline"
                  className="text-primary border-primary"
                >
                  Current Plan:{" "}
                  {usageInfo.subscription_status.charAt(0).toUpperCase() +
                    usageInfo.subscription_status.slice(1)}
                  {usageInfo.payment_period && usageInfo.subscription_status !== 'apprentice' && 
                    ` (${usageInfo.payment_period === 'annual' ? 'Annual' : 'Monthly'})`}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-primary border-primary"
                >
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
          
          <div className="hidden" ref={stripeBuyButtonRef}></div>
        </div>
      </div>
      {/* <SeekerDialog position="bottom" /> */}
    </div>
  );
};

export default Pricing;
