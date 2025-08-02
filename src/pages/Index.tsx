import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Upload,
  Zap,
  CheckCircle,
  Globe,
  MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import Lottie from "react-lottie";
import animationData from "@/animations/OOze.chat.json";
import Loading from "@/animations/Loading.json";
import OozeAnimation from "@/components/OozeAnimation";
import { CoreFeatures } from "@/components/home/CoreFeatures";
import { TopCompanies } from "@/components/home/TopCompanies";
import { ValueProposition } from "@/components/home/ValueProposition";
import WebsitesSection from "@/components/WebsitesSection";


const Home = () => {
  const { t } = useTranslation(['home', 'common']);
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

  // Lottie settings
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

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

  const handleStartTrial = async () => {
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (currentSession) {
        navigate("/alchemist-workshop");
      } else {
        navigate("/login");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          "There was a problem checking your login status. Please try again.",
        variant: "destructive",
      });
    }
  };

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
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 relative">
      {/* Cursor-following Ooze animation */}
      <OozeAnimation 
        followCursor={true}
        enlargeOnHover={true}
        width={100}
        height={100}
        showShadow={true}
      />
      
      <section className="bg-gradient-primary py-20 px-4">
        <div className="max-w-6xl mx-auto justify-center text-center">
          <h1 className="text-6xl font-bold bg-white text-transparent bg-clip-text mb-6 hero-element">
            {t('hero.title', { ns: 'home' })}
          </h1>
          <div className="w-full mx-auto flex items-center md:w-2/4 lg:w-1/3 xl:w-1/2">
            <Lottie options={defaultOptions} height={"100%"} width={"100%"} />
          </div>
          <p className="text-xl text-white mb-8 max-w-3xl mx-auto hero-element">
            {t('hero.subtitle', { ns: 'home' })}
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => {
                const featuresSection = document.getElementById("features");
                featuresSection?.scrollIntoView({ behavior: "smooth" });
              }}
              size="lg"
              className="bg-gradient-primary-light hover:opacity-90 transition-opacity hero-element"
            >
              {t('hero.learnMore', { ns: 'home' })}
            </Button>
            <Button
              onClick={handleStartTrial}
              size="lg"
              className="text-primary bg-white hover:bg-neutral-300 hero-element"
            >
              {session ? t('hero.goToWorkshop', { ns: 'home' }) : t('hero.startFreeTrial', { ns: 'home' })}
            </Button>
          </div>
        </div>
      </section>

      <CoreFeatures />
      <TopCompanies />
      <ValueProposition />
      
      <section className="py-20 bg-gradient-primary text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 hero-element">{t('cta.title', { ns: 'home' })}</h2>
          <p className="text-xl mb-8 opacity-90 hero-element">
            {t('cta.subtitle', { ns: 'home' })}
          </p>
          <Button
            onClick={handleStartTrial}
            size="lg"
            variant="secondary"
            className="bg-secondary hover:bg-secondary/90 text-primary hero-element"
          >
            {session ? t('hero.goToWorkshop', { ns: 'home' }) : t('hero.startFreeTrial', { ns: 'home' })}
          </Button>
        </div>
      </section>
      
      <WebsitesSection />

      <section className="py-20 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-primary text-transparent bg-clip-text">
            {t('faq.title', { ns: 'home' })}
          </h2>
          <div className="space-y-6">
            {(() => {
              const faqData = t('faq.questions', { ns: 'home', returnObjects: true });
              const faqs = Array.isArray(faqData) ? faqData : [];
              return faqs.map((faq: any, index: number) => (
                <div
                  key={index}
                  className="p-6 rounded-xl border border-neutral-200 bg-white hero-element"
                >
                  <h3 className="text-xl font-semibold mb-2">{faq.question}</h3>
                  <p className="text-neutral-600">{faq.answer}</p>
                </div>
              ));
            })()}
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => navigate("/faq")}
                size="lg"
                variant="outline"
                className="text-primary bg-white hover:bg-neutral-300 hero-element"
              >
                {t('faq.more', { ns: 'home' })}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
