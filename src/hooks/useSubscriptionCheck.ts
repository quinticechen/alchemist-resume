
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useSubscriptionCheck = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkSubscriptionAndRedirect = async (userId: string) => {
    console.log("Checking subscription for user:", userId);

    try {
      // First check cached profile data
      const cachedProfile = localStorage.getItem("userProfile");
      let profile = cachedProfile ? JSON.parse(cachedProfile) : null;

      // If no cached data or cache is old (>1 hour), fetch fresh data
      if (!profile || Date.now() - (profile.cachedAt || 0) > 3600000) {
        const { data: freshProfile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError) {
          console.error("Profile check error:", profileError);
          throw profileError;
        }

        if (freshProfile) {
          // Update cache with fresh data and timestamp
          profile = {
            ...freshProfile,
            cachedAt: Date.now(),
          };
          localStorage.setItem("userProfile", JSON.stringify(profile));
        }
      }
      
      console.log("Full profile data:", profile);

      if (!profile) {
        console.error("No profile found for user");
        throw new Error("No profile found");
      }

      // Check for grandmaster subscription - always allow access (highest priority)
      if (profile.subscription_status === "grandmaster") {
        console.log("User has Grandmaster subscription - granting unlimited access");
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
        return;
      }

      // For Alchemist, check monthly usage - strict comparison to ensure correct limit
      if (profile.subscription_status === "alchemist") {
        console.log("Alchemist user check - monthly usage:", profile.monthly_usage_count);
        // Check if user has reached or exceeded the 30 usage limit
        if ((profile.monthly_usage_count || 0) >= 30) {
          console.log("Alchemist user has reached monthly limit");
          toast({
            title: "Monthly Limit Reached",
            description: "You've reached your monthly usage limit.",
          });
          navigate("/account");
          return;
        } else {
          console.log("Alchemist user within monthly limit");
          toast({
            title: "Welcome back!",
            description: "You've successfully signed in.",
          });
          return;
        }
      }

      // Handle free trial cases only for apprentice users
      if (profile.subscription_status === "apprentice") {
        console.log("Apprentice user check - usage count:", profile.usage_count, "limit:", profile.free_trial_limit);
        if (profile.usage_count >= profile.free_trial_limit) {
          if (!profile.has_completed_survey) {
            toast({
              title: "Survey Required",
              description:
                "Please complete the survey to continue using our services.",
            });
            navigate("/survey-page");
            return;
          } else {
            toast({
              title: "Free Trial Completed",
              description: "Please upgrade to continue using our services.",
            });
            navigate("/pricing");
            return;
          }
        }
      }

      // User is within free trial limits or has valid subscription
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
    } catch (error) {
      console.error("Detailed subscription check error:", error);
      toast({
        title: "Error",
        description: "There was an error checking your subscription status.",
      });
      navigate("/login");
    }
  };

  return { checkSubscriptionAndRedirect };
};
