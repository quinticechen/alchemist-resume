import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import SeekerDialog from "@/components/SeekerDialog";

const pricingPlans = [
  {
    name: "Free",
    description: "Basic resume analysis for job seekers",
    price: "$0",
    features: [
      "1 resume analysis per month",
      "Basic ATS compatibility check",
      "Keyword suggestions",
    ],
    buttonText: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    description: "Advanced features for serious job seekers",
    price: "$19",
    period: "per month",
    features: [
      "5 resume analyses per month",
      "Advanced ATS optimization",
      "Tailored keyword suggestions",
      "Resume formatting assistance",
      "Priority support",
    ],
    buttonText: "Upgrade to Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For teams and organizations",
    price: "Contact us",
    features: [
      "Unlimited resume analyses",
      "Team management dashboard",
      "API access",
      "Dedicated account manager",
      "Custom integration options",
    ],
    buttonText: "Contact Sales",
    popular: false,
  },
];

const Pricing = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  const handlePlanSelect = (plan: string) => {
    if (!session) {
      navigate("/login", { state: { from: "/pricing" } });
      return;
    }

    if (plan === "Free") {
      navigate("/alchemist-workshop");
    } else if (plan === "Pro") {
      navigate("/payment-success");
    } else {
      // Enterprise plan - could open a contact form or modal
      window.open("mailto:sales@resumealchemist.com?subject=Enterprise Plan Inquiry", "_blank");
    }
  };

  return (
    <div className="bg-gradient-to-b from-neutral-50 to-neutral-100 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-primary text-transparent bg-clip-text mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Choose the plan that's right for your job search journey
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`flex flex-col ${
                plan.popular 
                  ? "border-primary shadow-lg relative" 
                  : "border-neutral-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 mx-auto w-fit px-3 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-neutral-500 ml-1">{plan.period}</span>
                  )}
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full ${plan.popular ? "" : "bg-neutral-800 hover:bg-neutral-700"}`}
                  onClick={() => handlePlanSelect(plan.name)}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto text-left space-y-6">
            <div>
              <h3 className="font-semibold text-lg">Can I cancel my subscription?</h3>
              <p className="text-neutral-600">Yes, you can cancel your subscription at any time. Your benefits will continue until the end of your billing period.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">What payment methods do you accept?</h3>
              <p className="text-neutral-600">We accept all major credit cards, PayPal, and Apple Pay.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Is there a free trial?</h3>
              <p className="text-neutral-600">Yes, our Free plan allows you to try our core features without any commitment.</p>
            </div>
          </div>
        </div>
      </div>
      <SeekerDialog position="bottom" />
    </div>
  );
};

export default Pricing;
