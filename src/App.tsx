
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import AlchemistWorkshop from "@/pages/AlchemyStation";
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
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.log('No session found, redirecting to login');
          navigate('/login', { 
            state: { returnTo: location.pathname },
            replace: true 
          });
          return;
        }

        // Get profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('subscription_status, usage_count, free_trial_limit, monthly_usage_count')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw profileError;
        }

        console.log('Profile data:', profile);

        if (!profile) {
          console.error('No profile found');
          throw new Error('No profile found');
        }

        let userHasAccess = false;

        // Simplified access check logic
        switch (profile.subscription_status) {
          case 'alchemist':
            userHasAccess = (profile.monthly_usage_count || 0) < 30;
            console.log('Alchemist check:', { monthly: profile.monthly_usage_count, hasAccess: userHasAccess });
            break;
          case 'apprentice':
            userHasAccess = profile.usage_count < profile.free_trial_limit;
            console.log('Apprentice check:', { usage: profile.usage_count, limit: profile.free_trial_limit });
            break;
          case 'grandmaster':
            const { data: subscription } = await supabase
              .from('subscriptions')
              .select('current_period_end')
              .eq('user_id', session.user.id)
              .eq('status', 'active')
              .maybeSingle();
            userHasAccess = subscription?.current_period_end 
              ? new Date(subscription.current_period_end) > new Date()
              : false;
            console.log('Grandmaster check:', { subscription, hasAccess: userHasAccess });
            break;
          default:
            userHasAccess = false;
        }

        if (isSubscribed) {
          setHasAccess(userHasAccess);
          setIsLoading(false);
          
          if (!userHasAccess) {
            toast({
              title: "Access Restricted",
              description: profile.subscription_status === 'apprentice'
                ? "Free trial completed. Please upgrade your plan to continue."
                : "Please check your subscription status.",
            });
            navigate('/pricing', { replace: true });
          }
        }
      } catch (error) {
        console.error('Access check error:', error);
        if (isSubscribed) {
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

    checkAccess();
    
    return () => {
      isSubscribed = false;
    };
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mb-4 text-xl font-semibold text-primary">Loading...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return hasAccess ? <>{children}</> : null;
};

const AuthWrapper = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isSubscribed = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (isSubscribed) {
          setSession(currentSession);
          setInitialized(true);

          if (currentSession) {
            // Get user profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('subscription_status')
              .eq('id', currentSession.user.id)
              .single();

            if (profile) {
              toast({
                title: "Welcome back!",
                description: "Successfully signed in"
              });

              // Handle redirect
              const state = location.state as { returnTo?: string };
              const returnTo = state?.returnTo || '/alchemist-workshop';
              navigate(returnTo, { replace: true });
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isSubscribed) {
          setInitialized(true);
          toast({
            title: "Error",
            description: "There was an error initializing the application.",
            variant: "destructive"
          });
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (isSubscribed) {
        setSession(session);
        setInitialized(true);

        if (event === 'SIGNED_IN' && session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_status')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            toast({
              title: "Welcome back!",
              description: "Successfully signed in"
            });

            const state = location.state as { returnTo?: string };
            const returnTo = state?.returnTo || '/alchemist-workshop';
            navigate(returnTo, { replace: true });
          }
        } else if (event === 'SIGNED_OUT') {
          navigate('/login', { replace: true });
        }
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mb-4 text-xl font-semibold text-primary">Loading...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
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
          <Route 
            path="/account" 
            element={
              session ? <Account /> : 
              <Navigate to="/login" replace state={{ returnTo: "/account" }} />
            }
          />
          <Route 
            path="/login" 
            element={
              session ? 
                <Navigate 
                  to={(location.state as { returnTo?: string })?.returnTo || '/alchemist-workshop'} 
                  replace 
                /> : 
                <Login />
            }
          />
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
  );
};

function App() {
  return (
    <Router>
      <AuthWrapper />
    </Router>
  );
}

export default App;
