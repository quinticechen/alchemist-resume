
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
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
        setIsLoading(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session?.user) {
          console.log('No session found, redirecting to login');
          navigate('/login', { 
            state: { returnTo: location.pathname },
            replace: true 
          });
          return;
        }

        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('current_period_end, status, tier')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .maybeSingle();

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('subscription_status, usage_count, free_trial_limit, monthly_usage_count')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

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
        }
      } catch (error) {
        console.error('Access check error:', error);
        if (isSubscribed) {
          setHasAccess(false);
          toast({
            title: "Error