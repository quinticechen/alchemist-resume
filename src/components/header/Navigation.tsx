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
              <Link
                to="/alchemist-workshop"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors flex items-center gap-2"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 10H19C21 10 22 9 22 7V5C22 3 21 2 19 2H17C15 2 14 3 14 5V7C14 9 15 10 17 10Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 22H7C9 22 10 21 10 19V17C10 15 9 14 7 14H5C3 14 2 15 2 17V19C2 21 3 22 5 22Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 10C8.20914 10 10 8.20914 10 6C10 3.79086 8.20914 2 6 2C3.79086 2 2 3.79086 2 6C2 8.20914 3.79086 10 6 10Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 22C20.2091 22 22 20.2091 22 18C22 15.7909 20.2091 14 18 14C15.7909 14 14 15.7909 14 18C14 20.2091 15.7909 22 18 22Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Workshop
              </Link>
            </li>
            <li>
              <Link
                to="/alchemy-records"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors flex items-center gap-2"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 10H18C15 10 14 9 14 6V2L22 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Records
              </Link>
            </li>
            <li>
              <Link
                to="/pricing"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors flex items-center gap-2"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Upgrade
              </Link>
            </li>
            <li>
              <Link
                to="/job-websites"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors flex items-center gap-2"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7.99998 3H8.99998C7.04998 8.84 7.04998 15.16 8.99998 21H7.99998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 3C16.95 8.84 16.95 15.16 15 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 16V15C8.84 16.95 15.16 16.95 21 15V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 9.00001C8.84 7.05001 15.16 7.05001 21 9.00001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Support Website
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
