import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const companies = ["Google", "Amazon", "Microsoft", "Apple", "Meta"];

const features = [
  {
    title: "Upload Resume",
    description: "Submit your existing PDF resume",
    icon: Upload,
  },
  {
    title: "Add Job Link",
    description: "Paste the URL of your target job posting",
    icon: ArrowRight,
  },
  {
    title: "Get Optimized",
    description: "Receive a perfectly matched resume",
    icon: Zap,
  },
];

const globalPlatforms = [
  { name: "LinkedIn", url: "linkedin.com" },
  { name: "Indeed", url: "indeed.com" },
  { name: "Glassdoor", url: "glassdoor.com" },
  { name: "Foundit", url: "foundit.in" },
  { name: "ZipRecruiter", url: "ziprecruiter.com" },
  { name: "SimplyHired", url: "simplyhired.com" },
];

const asianPlatforms = [
  { name: "104 Job Bank", url: "104.com.tw" },
  { name: "1111 Job Bank", url: "1111.com.tw" },
  { name: "JobsDB", url: "jobsdb.com" },
  { name: "Rikunabi NEXT", url: "next.rikunabi.com" },
  // { name: "51job", url: "51job.com" },
];

const faqs = [
  {
    question: "How many free uses do I get?",
    answer: "New users receive 3 free uses to try our service.",
  },
  {
    question: "What file formats are supported?",
    answer: "Currently, we support PDF format for resume uploads.",
  },
  {
    question: "How long does the process take?",
    answer: "The optimization process typically takes 2-3 minutes.",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Lottie configuration (using react-lottie)
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

        // console.log("Initial session check:", initialSession);
        setSession(initialSession);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, currentSession) => {
          // console.log("Auth state changed:", event, currentSession);
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
        // console.error("Session initialization error:", error);
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
      // console.log("Current session before navigation:", currentSession);

      if (currentSession) {
        // console.log("Navigating to workshop (user is logged in)");
        navigate("/alchemist-workshop");
      } else {
        // console.log("Navigating to login (user is not logged in)");
        navigate("/login");
      }
    } catch (error) {
      // console.error("Navigation error:", error);
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
          <div className="mb-4 text-xl font-semibold text-primary">
            Loading...
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <section className="bg-gradient-primary py-20 px-4">
        <div className="max-w-6xl mx-auto justify-center text-center">
          <h1 className="text-6xl font-bold bg-white text-transparent bg-clip-text mb-6">
            Transform Your Resume with AI Alchemy
          </h1>
          <div className="w-full mx-auto flex items-center md:w-2/4 lg:w-1/3 xl:w-1/2">
            <Lottie options={defaultOptions} height={"100%"} width={"100%"} />
          </div>
          <p className="text-xl text-white mb-8 max-w-3xl mx-auto">
            Turn your ordinary resume into the perfect match for your dream job
            using our AI-powered optimization technology.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => {
                const featuresSection = document.getElementById("features");
                featuresSection?.scrollIntoView({ behavior: "smooth" });
              }}
              size="lg"
              className="bg-gradient-primary-light hover:opacity-90 transition-opacity"
            >
              Learn More
            </Button>
            <Button
              onClick={handleStartTrial}
              size="lg"
              className="text-primary bg-white hover:bg-neutral-300"
            >
              {session ? "Go to Workshop" : "Start Free Trial"}
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border border-neutral-200 bg-white shadow-apple hover:shadow-apple-lg transition-shadow"
              >
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-neutral-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-semibold text-neutral-600 mb-8">
            Optimize Your Resume for Top Companies
          </h2>
          <div className="flex flex-wrap justify-center gap-8 items-center">
            {companies.map((company) => (
              <span
                key={company}
                className="text-2xl font-bold bg-gradient-primary text-transparent bg-clip-text"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-primary text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Start with 3 Free Uses</h2>
          <p className="text-xl mb-8 opacity-90">
            Try our AI-powered resume optimization with no commitment.
          </p>
          <Button
            onClick={handleStartTrial}
            size="lg"
            variant="secondary"
            className="bg-secondary hover:bg-secondary/90 text-primary"
          >
            {session ? "Go to Workshop" : "Start Free Trial"}
          </Button>
        </div>
      </section>

      <section id="supported-websites" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Supported Job Platforms
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="h-6 w-6 text-primary" />
                <h3 className="text-2xl font-semibold">Global Platforms</h3>
              </div>
              <ul className="space-y-4">
                {globalPlatforms.map((platform) => (
                  <li key={platform.url} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="font-medium">{platform.name}</span>
                    <span className="text-neutral-500">({platform.url})</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="h-6 w-6 text-primary" />
                <h3 className="text-2xl font-semibold">
                  Asian Regional Platforms
                </h3>
              </div>
              <ul className="space-y-4">
                {asianPlatforms.map((platform) => (
                  <li key={platform.url} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="font-medium">{platform.name}</span>
                    <span className="text-neutral-500">({platform.url})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border border-neutral-200 bg-white"
              >
                <h3 className="text-xl font-semibold mb-2">{faq.question}</h3>
                <p className="text-neutral-600">{faq.answer}</p>
              </div>
            ))}
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => navigate("/faq")}
                size="lg"
                variant="outline"
                className="bg-secondary hover:bg-secondary/90 text-primary"
              >
                More
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;