
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
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const AuthWrapper = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkUserAccess = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, usage_count, free_trial_limit, monthly_usage_count')
      .eq('id', userId)
      .single();

    if (!profile) {
      return false;
    }

    if (profile.subscription_status === 'apprentice') {
      return profile.usage_count < profile.free_trial_limit;
    }

    if (profile.subscription_status === 'alchemist') {
      return (profile.monthly_usage_count || 0) < 30;
    }

    if (profile.subscription_status === 'grandmaster') {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('current_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (subscription?.current_period_end) {
        return new Date(subscription.current_period_end) > new Date();
      }
    }

    return false;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setInitialized(true);

      if (event === 'SIGNED_IN' && session?.user) {
        const hasAccess = await checkUserAccess(session.user.id);
        if (hasAccess) {
          toast({
            title: "Welcome back!",
            description: "Successfully signed in"
          });
          navigate('/alchemist-workshop');
        } else {
          navigate('/pricing');
        }
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
              session ? <AlchemistWorkshop /> : 
              <Navigate to="/login" replace state={{ from: "/alchemist-workshop" }} />
            } 
          />
          <Route 
            path="/alchemy-records" 
            element={
              session ? <AlchemyRecords /> : 
              <Navigate to="/login" replace state={{ from: "/alchemy-records" }} />
            } 
          />
          <Route 
            path="/account" 
            element={
              session ? <Account /> : 
              <Navigate to="/login" replace state={{ from: "/account" }} />
            } 
          />
          <Route 
            path="/login" 
            element={
              session ? <Navigate to="/alchemist-workshop" replace /> : <Login />
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
