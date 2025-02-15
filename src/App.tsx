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
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setIsLoading(false);
        navigate('/login', { 
          state: { returnTo: location.pathname },
          replace: true 
        });
        return;
      }

      // First check if user has an active subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, tier, current_period_end')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle();

      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, usage_count, free_trial_limit, monthly_usage_count')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        navigate('/login');
        setIsLoading(false);
        return;
      }

      let userHasAccess = false;

      // Check subscription first
      if (subscription?.status === 'active') {
        if (subscription.tier === 'grandmaster') {
          userHasAccess = new Date(subscription.current_period_end!) > new Date();
        } else if (subscription.tier === 'alchemist') {
          userHasAccess = (profile.monthly_usage_count || 0) < 30;
        }
      } else {
        // Fallback to profile check for apprentice
        if (profile.subscription_status === 'apprentice') {
          userHasAccess = profile.usage_count < profile.free_trial_limit;
        } else if (profile.subscription_status === 'alchemist') {
          userHasAccess = (profile.monthly_usage_count || 0) < 30;
        }
      }

      if (!userHasAccess) {
        toast({
          title: "Access Denied",
          description: profile.subscription_status === 'apprentice' 
            ? "Free trial completed. Please upgrade your plan to continue."
            : "Please check your subscription status or upgrade your plan.",
        });
        navigate('/pricing');
      }

      setHasAccess(userHasAccess);
      setIsLoading(false);
    };

    checkAccess();
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setInitialized(true);

      if (event === 'SIGNED_IN' && session) {
        // Check user's subscription status
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', session.user.id)
          .single();

        toast({
          title: "Welcome back!",
          description: "Successfully signed in"
        });

        // Get the return path from state, default to workshop if none
        const state = location.state as { returnTo?: string };
        const returnTo = state?.returnTo || '/alchemist-workshop';
        navigate(returnTo, { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
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
