
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useSubscriptionCheck = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkSubscriptionAndRedirect = async (userId: string) => {
    console.log('Checking subscription for user:', userId);
    
    try {
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (subError) {
        console.error('Subscription check error:', subError);
        throw subError;
      }
      
      console.log('Full subscription data:', subscription);

      // Check for active subscription first
      if (subscription?.status === 'active' && 
          (subscription.tier === 'alchemist' || subscription.tier === 'grandmaster')) {
        console.log('Valid active subscription found:', subscription);
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in."
        });
        return; // Don't navigate - let the app handle normal routing
      }

      // If no active subscription, check profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Profile check error:', profileError);
        throw profileError;
      }

      console.log('Full profile data:', profile);

      if (!profile) {
        console.error('No profile found for user');
        throw new Error('No profile found');
      }

      // Check profile subscription status
      if (profile.subscription_status === 'grandmaster' || 
          profile.subscription_status === 'alchemist') {
        console.log('Premium status in profile:', profile.subscription_status);
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in."
        });
        return; // Don't navigate - let the app handle normal routing
      }

      // Handle free trial cases
      if (profile.usage_count >= profile.free_trial_limit) {
        if (!profile.has_completed_survey) {
          toast({
            title: "Survey Required",
            description: "Please complete the survey to continue using our services."
          });
          navigate('/survey-page');
          return;
        } else {
          toast({
            title: "Free Trial Completed",
            description: "Please upgrade to continue using our services."
          });
          navigate('/pricing');
          return;
        }
      }

      // User is within free trial limits
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in."
      });
      // Don't navigate - let the app handle normal routing
    } catch (error) {
      console.error('Detailed subscription check error:', error);
      toast({
        title: "Error",
        description: "There was an error checking your subscription status."
      });
      navigate('/login');
    }
  };

  return { checkSubscriptionAndRedirect };
};
