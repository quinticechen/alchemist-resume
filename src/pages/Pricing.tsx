
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Free Trial",
      price: "$0",
      period: "",
      features: [
        "3 Resume Customizations",
        "Basic AI Analysis",
        "PDF Format Support",
        "24-hour Support",
      ],
      buttonText: "Start Free Trial",
      highlighted: false,
    },
    {
      name: "Professional",
      price: "$19",
      period: "/month",
      features: [
        "Unlimited Resume Customizations",
        "Advanced AI Analysis",
        "Priority Support",
        "Resume Performance Analytics",
        "Multiple Resume Versions",
        "Interview Tips",
      ],
      buttonText: "Get Started",
      highlighted: true,
    },
  ];

  const handlePlanSelection = () => {
    navigate("/pre-pricing");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-primary text-transparent bg-clip-text">
            Choose Your Plan
          </h1>
          <p className="text-xl text-center text-neutral-600 mb-12">
            Start with a free trial or upgrade for unlimited access
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-xl p-8 ${
                  plan.highlighted
                    ? "bg-gradient-primary text-white ring-2 ring-primary"
                    : "bg-white"
                }`}
              >
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-lg ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <Check className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={handlePlanSelection}
                  className={`w-full ${
                    plan.highlighted
                      ? "bg-white text-primary hover:bg-neutral-100"
                      : "bg-gradient-primary text-white hover:opacity-90"
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
