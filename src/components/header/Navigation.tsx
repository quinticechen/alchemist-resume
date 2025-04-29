import { Link, useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkle, Hammer, ScrollText, Crown, Globe, HelpCircle, Wallet } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const checkProfileData = async () => {
      try {
        if (!session?.user) {
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('usage_count, has_completed_survey, free_trial_limit, subscription_status')
          .eq('id', session.user.id)
          .maybeSingle();

        if (isMounted && profile) {
          setUsageCount(profile.usage_count || 0);
          setHasCompletedSurvey(profile.has_completed_survey || false);
          setFreeTrialLimit(profile.free_trial_limit);
          setSubscriptionStatus(profile.subscription_status);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkProfileData();

    return () => {
      isMounted = false;
    };
  }, [session]);

  const handleWorkshopClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!session) {
      navigate('/login');
      return;
    }

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
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors flex items-center gap-2"
              >
                <Sparkle className="h-5 w-5" />
                <span className="hidden sm:inline">Workshop</span>
              </a>
            </li>
            <li>
              <Link
                to="/alchemy-records"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors flex items-center gap-2"
              >
                <ScrollText className="h-5 w-5" />
                <span className="hidden sm:inline">Records</span>
              </Link>
            </li>
            <li>
              <Link
                to="/job-websites"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors flex items-center gap-2"
              >
                <Globe className="h-5 w-5" />
                <span className="hidden sm:inline">Supported Websites</span>
              </Link>
            </li>
            <li>
              <Link
                to="/pricing"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors flex items-center gap-2"
              >
                <Crown className="h-5 w-5" />
                <span className="hidden sm:inline">Upgrade</span>
              </Link>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link
                to="/job-websites"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors flex items-center gap-2"
              >
                <Globe className="h-5 w-5" />
                <span className="hidden sm:inline">Supported Websites</span>
              </Link>
            </li>
            <li>
              <Link
                to="/pricing"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors flex items-center gap-2"
              >
                <Wallet className="h-5 w-5" />
                <span className="hidden sm:inline">Pricing</span>
              </Link>
            </li>
            <li>
              <Link
                to="/faq"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors flex items-center gap-2"
              >
                <HelpCircle className="h-5 w-5" />
                <span className="hidden sm:inline">FAQ</span>
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navigation;
