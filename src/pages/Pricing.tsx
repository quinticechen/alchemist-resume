import React from "react";
import { useLocation } from "react-router-dom";
import JellyfishAnimation from "@/components/JellyfishAnimation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Pricing = () => {
  const location = useLocation();
  const fromSignup = location.state?.fromSignup || false;
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCheckout = async (priceId: string) => {
    if (!session) {
      navigate("/login", { state: { from: "/pricing" } });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, returnUrl: window.location.origin + "/payment-success" },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Checkout Error",
        description: "There was a problem starting the checkout process. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 relative">
          <h1 className="text-4xl font-bold bg-gradient-primary text-transparent bg-clip-text mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Elevate your job search with Resume Alchemist's affordable plans designed to help you land your dream job.
          </p>
          
          <div className="absolute top-0 right-0">
            <JellyfishAnimation width={120} height={120} className="opacity-80" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <Card className="border-2 border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-2xl">Free Trial</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-gray-500 ml-2">/ month</span>
              </div>
              <CardDescription className="mt-2">
                Try our basic features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span>1 resume optimization</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span>Basic resume analysis</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span>PDF export</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate("/alchemist-workshop")}
              >
                Get Started
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className="border-2 border-primary relative hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">$9.99</span>
                <span className="text-gray-500 ml-2">/ month</span>
              </div>
              <CardDescription className="mt-2">
                Perfect for active job seekers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span>10 resume optimizations per month</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span>Advanced AI analysis</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span>Multiple resume formats</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span>Cover letter assistance</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span>Priority support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-primary hover:bg-primary-dark" 
                onClick={() => handleCheckout("price_1OGJZnCRcGLTDVIqXxLTXBXO")}
              >
                Subscribe Now
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card className="border-2 border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-2xl">Premium</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">$19.99</span>
                <span className="text-gray-500 ml-2">/ month</span>
              </div>
              <CardDescription className="mt-2">
                For serious career advancement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span>Unlimited resume optimizations</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span>Premium AI analysis</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span>All resume formats</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span>Advanced cover letter generation</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span>Interview preparation</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span>1-on-1 career coaching session</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handleCheckout("price_1OGJaVCRcGLTDVIqnHUXXuRl")}
              >
                Subscribe Now
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            <div>
              <h3 className="font-bold text-lg">Can I cancel my subscription anytime?</h3>
              <p className="text-gray-600">Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.</p>
            </div>
            <div>
              <h3 className="font-bold text-lg">How does the resume optimization work?</h3>
              <p className="text-gray-600">Our AI analyzes your resume against the job description you provide, then suggests tailored improvements to increase your chances of getting an interview.</p>
            </div>
            <div>
              <h3 className="font-bold text-lg">Is my data secure?</h3>
              <p className="text-gray-600">Absolutely. We use industry-standard encryption and security practices to protect your personal information and resume data.</p>
            </div>
            <div>
              <h3 className="font-bold text-lg">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards, including Visa, Mastercard, American Express, and Discover.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
