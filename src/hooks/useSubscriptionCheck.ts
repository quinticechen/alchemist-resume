
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useSubscriptionCheck = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const checkSubscriptionAndRedirect = async (userId: string, showWelcomeToast = true) => {
    console.log("Checking subscription for user:", userId);

    // Check if we've already shown the welcome toast in this session
    const welcomeToastShown = sessionStorage.getItem('welcomeToastShown') === 'true';
    const isFreshLogin = sessionStorage.getItem('freshLogin') === 'true';
    
    // Only show welcome toast if explicitly requested, hasn't been shown yet, and it's a fresh login
    const shouldShowWelcomeToast = showWelcomeToast && !welcomeToastShown && isFreshLogin;
    
    try {
      // First check cached profile data
      const cachedProfile = localStorage.getItem("userProfile");
      let profile = cachedProfile ? JSON.parse(cachedProfile) : null;
      let isCacheValid = false;

      // Validate cache freshness (less than 5 minutes old)
      if (profile && profile.cachedAt && Date.now() - profile.cachedAt < 300000) {
        console.log("Using cached profile data (less than 5 minutes old)");
        isCacheValid = true;
      } else {
        console.log("Cache invalid or expired, fetching fresh profile data");
      }

      // If no valid cached data, fetch fresh data
      if (!isCacheValid) {
        console.log("Fetching fresh profile data from database");
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
          console.log("Updated profile cache with fresh data");
        }
      }
      
      console.log("Full profile data:", profile);

      if (!profile) {
        console.error("No profile found for user");
        throw new Error("No profile found");
      }

      // Check subscription_status directly as a string since that's how it's stored in the database
      const subscriptionStatus = profile.subscription_status;
      console.log("User subscription status:", subscriptionStatus);

      // Check for grandmaster subscription - always allow access (highest priority)
      if (subscriptionStatus === "grandmaster") {
        console.log("User has Grandmaster subscription - granting unlimited access");
        
        // Only show welcome toast if conditions are met
        if (shouldShowWelcomeToast) {
          toast({
            title: "Welcome back!",
            description: "You've successfully signed in.",
          });
          // Set the flag that we've shown the welcome toast
          sessionStorage.setItem('welcomeToastShown', 'true');
        }
        
        // Clear the fresh login flag once processed
        sessionStorage.removeItem('freshLogin');
        return;
      }

      // For Alchemist, check monthly usage - strict comparison to ensure correct limit
      if (subscriptionStatus === "alchemist") {
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
          
          // Only show welcome toast if conditions are met
          if (shouldShowWelcomeToast) {
            toast({
              title: "Welcome back!",
              description: "You've successfully signed in.",
            });
            // Set the flag that we've shown the welcome toast
            sessionStorage.setItem('welcomeToastShown', 'true');
          }
          
          // Clear the fresh login flag once processed
          sessionStorage.removeItem('freshLogin');
          return;
        }
      }

      // Handle free trial cases only for apprentice users
      if (subscriptionStatus === "apprentice") {
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
      // Only show welcome toast if conditions are met
      if (shouldShowWelcomeToast) {
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
        // Set the flag that we've shown the welcome toast
        sessionStorage.setItem('welcomeToastShown', 'true');
      }
      
      // Clear the fresh login flag once processed
      sessionStorage.removeItem('freshLogin');
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
