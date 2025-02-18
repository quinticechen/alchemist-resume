import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "@/pages/Home";
import AlchemistWorkshop from "@/pages/AlchemistWorkshop";
import AlchemyRecords from "@/pages/AlchemyRecords";
import Account from "@/pages/Account";
import Login from "@/pages/Login";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import FAQ from "@/pages/FAQ";
import Pricing from "@/pages/Pricing";
import SurveyPage from "@/pages/SurveyPage";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="mb-4 text-xl font-semibold text-primary">Loading...</div>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    let isSubscribed = true;

    const checkAccess = async () => {
      try {
        console.log('Checking session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }
        
        if (!session?.user) {
          console.log('No valid session found, redirecting to login');
          if (isSubscribed) {
            setIsLoading(false);
            navigate('/login', { 
              state: { returnTo: location.pathname },
              replace: true 
            });
          }
          return;
        }

        console.log('Valid session found, checking subscription...');
        
        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (isSubscribed && isLoading) {
            console.log('Access check timed out');
            setIsLoading(false);
            setHasAccess(false);
            navigate('/login', { replace: true });
            toast({
              title: "Error",
              description: "Session verification timed out. Please try logging in again.",
              variant: "destructive"
            });
          }
        }, 10000); // 10 second timeout

        try {
          // First check cached subscription data
          const cachedSubscription = localStorage.getItem('userSubscription');
          let subscription = cachedSubscription ? JSON.parse(cachedSubscription) : null;

          if (!subscription || (Date.now() - (subscription.cachedAt || 0) > 3600000)) {
            console.log('Fetching fresh subscription data...');
            const { data: freshSubscription } = await supabase
              .from('subscriptions')
              .select('current_period_end, status, tier')
              .eq('user_id', session.user.id)
              .eq('status', 'active')
              .maybeSingle();

            if (freshSubscription) {
              subscription = {
                ...freshSubscription,
                cachedAt: Date.now()
              };
              localStorage.setItem('userSubscription', JSON.stringify(subscription));
            }
          }

          // Check profile data
          const cachedProfile = localStorage.getItem('userProfile');
          let profile = cachedProfile ? JSON.parse(cachedProfile) : null;

          if (!profile || (Date.now() - (profile.cachedAt || 0) > 3600000)) {
            console.log('Fetching fresh profile data...');
            const { data: freshProfile, error: profileError } = await supabase
              .from('profiles')
              .select('subscription_status, usage_count, free_trial_limit, monthly_usage_count')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profileError) {
              console.error('Profile fetch error:', profileError);
              throw profileError;
            }

            if (freshProfile) {
              profile = {
                ...freshProfile,
                cachedAt: Date.now()
              };
              localStorage.setItem('userProfile', JSON.stringify(profile));
            }
          }

          if (!profile) {
            throw new Error('No profile found');
          }

          let userHasAccess = false;

          if (subscription?.status === 'active' && subscription?.current_period_end) {
            const isSubscriptionValid = new Date(subscription.current_period_end) > new Date();
            if (isSubscriptionValid) {
              userHasAccess = true;
            }
          } else {
            switch (profile.subscription_status) {
              case 'alchemist':
                userHasAccess = (profile.monthly_usage_count || 0) < 30;
                break;
              case 'apprentice':
                userHasAccess = profile.usage_count < profile.free_trial_limit;
                break;
              default:
                userHasAccess = false;
            }
          }

          clearTimeout(timeoutId);

          if (isSubscribed) {
            setHasAccess(userHasAccess);
            
            if (!userHasAccess) {
              toast({
                title: "Access Restricted",
                description: profile.subscription_status === 'apprentice'
                  ? "Free trial completed. Please upgrade your plan to continue."
                  : "Please check your subscription status.",
              });
              navigate('/pricing', { replace: true });
            }
            setIsLoading(false);
          }
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }

      } catch (error) {
        console.error('Access check error:', error);
        if (isSubscribed) {
          setHasAccess(false);
          setIsLoading(false);
          toast({
            title: "Error",
            description: "There was an error checking your access. Please try again.",
            variant: "destructive"
          });
          navigate('/login', { replace: true });
        }
      }
    };

    // Initial check
    checkAccess();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      if (event === 'SIGNED_OUT') {
        setHasAccess(false);
        navigate('/login', { replace: true });
      } else if (event === 'SIGNED_IN' && session) {
        checkAccess();
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [navigate, location, toast]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return hasAccess ? <>{children}</> : null;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route 
                path="/alchemist-workshop" 
                element={
                  <ProtectedRoute>
                    <AlchemistWorkshop />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/alchemy-records" 
                element={
                  <ProtectedRoute>
                    <AlchemyRecords />
                  </ProtectedRoute>
                }
              />
              <Route path="/account" element={<Account />} />
              <Route path="/login" element={<Login />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/survey-page" element={<SurveyPage />} />
            </Routes>
          </main>
          <Footer />
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
