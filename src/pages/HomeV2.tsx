import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import WebsitesSection from "@/components/WebsitesSection";

// Import home page components
import { HeroSection } from "@/components/home/HeroSection";
import { CoreFeatures } from "@/components/home/CoreFeatures";
import { ValueProposition } from "@/components/home/ValueProposition";
import { CallToAction } from "@/components/home/CallToAction";
import Lottie from "react-lottie";
import Loading from "@/animations/Loading.json";

const Home = () => {
  const loadingOptions = {
    loop: true,
    autoplay: true,
    animationData: Loading,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }

        setSession(initialSession);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, currentSession) => {
          setSession(currentSession);

          if (event === "SIGNED_IN" && currentSession) {
            toast({
              title: "Successfully signed in",
              description: "Redirecting to workshop...",
            });
            navigate("/alchemist-workshop");
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        toast({
          title: "Error",
          description:
            "There was a problem checking your login status. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-64 h-64 mx-auto">
            <Lottie options={loadingOptions} />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="relative isolate z-0 overflow-hidden bg-gradient-to-b from-neutral-50 to-white">
        <HeroSection />
        <CoreFeatures />
        <ValueProposition />
        <CallToAction />
        <WebsitesSection />
      </div>
    </div>
  );
};

export default Home;
