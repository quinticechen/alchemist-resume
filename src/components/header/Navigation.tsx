
import { Link, useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NavigationProps {
  session: Session | null;
  onSupportedWebsitesClick: () => void;
  isHome: boolean;
}

const Navigation = ({ session, onSupportedWebsitesClick, isHome }: NavigationProps) => {
  const [usageCount, setUsageCount] = useState(0);
  const [hasCompletedSurvey, setHasCompletedSurvey] = useState(false);
  const [freeTrialLimit, setFreeTrialLimit] = useState(3);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('apprentice');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (session?.user) {
      checkProfileData();
    }
  }, [session]);

  const checkProfileData = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('usage_count, has_completed_survey, free_trial_limit, subscription_status')
      .eq('id', session!.user.id)
      .single();

    if (profile) {
      setUsageCount(profile.usage_count || 0);
      setHasCompletedSurvey(profile.has_completed_survey || false);
      setFreeTrialLimit(profile.free_trial_limit);
      setSubscriptionStatus(profile.subscription_status);
    }
  };

  const handleWorkshopClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Only check usage limits for free tier (apprentice)
    if (subscriptionStatus === 'apprentice' && usageCount >= freeTrialLimit) {
      toast({
        title: "Free Trial Expired",
        description: "Please upgrade to continue using our services.",
      });
      navigate('/pricing');
    } else {
      navigate('/alchemist-workshop');
    }
  };

  return (
    <nav>
      <ul className="flex items-center gap-6">
        {session ? (
          <>
            <li>
              <a
                href="/alchemist-workshop"
                onClick={handleWorkshopClick}
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors"
              >
                Workshop
              </a>
            </li>
            <li>
              <Link
                to="/alchemy-records"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors"
              >
                Records
              </Link>
            </li>
            <li>
              <Link
                to="/pricing"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors"
              >
                Upgrade
              </Link>
            </li>
          </>
        ) : (
          <>
            {isHome ? (
              <li>
                <button
                  onClick={onSupportedWebsitesClick}
                  className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors"
                >
                  Supported Websites
                </button>
              </li>
            ) : null}
            <li>
              <Link
                to="/pricing"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors"
              >
                Pricing
              </Link>
            </li>
            <li>
              <Link
                to="/faq"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors"
              >
                FAQ
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navigation;
