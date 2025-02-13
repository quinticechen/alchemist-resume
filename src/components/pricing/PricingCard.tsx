
import { FC } from 'react';
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingPlan {
  name: string;
  planId: string;
  price: {
    monthly: string;
    annual: string;
  };
  features: string[];
  buttonText: string;
  highlighted: boolean;
  showButton: boolean;
  mostPopular?: boolean;
}

interface PricingCardProps {
  plan: PricingPlan;
  isAnnual: boolean;
  isLoading: boolean;
  onSelect: (planId: string) => void;
}

export const PricingCard: FC<PricingCardProps> = ({ 
  plan, 
  isAnnual, 
  isLoading, 
  onSelect 
}) => {
  return (
    <div
      className={`rounded-xl p-8 relative ${
        plan.highlighted
          ? "bg-gradient-primary text-white ring-2 ring-primary"
          : "bg-white"
      }`}
    >
      {plan.mostPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
      <div className="flex items-baseline mb-6">
        <span className="text-4xl font-bold">
          {isAnnual ? plan.price.annual : plan.price.monthly}
        </span>
        <span className="text-lg ml-1">
          {plan.price.monthly !== "$0" && `/${isAnnual ? 'year' : 'month'}`}
        </span>
      </div>
      <ul className="space-y-4 mb-8">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-center">
            <Check className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {plan.showButton && (
        <Button
          onClick={() => onSelect(plan.planId)}
          disabled={isLoading}
          className={`w-full ${
            plan.highlighted
              ? "bg-white text-primary hover:bg-neutral-100"
              : "bg-gradient-primary text-white hover:opacity-90"
          }`}
        >
          {isLoading ? "Processing..." : plan.buttonText}
        </Button>
      )}
    </div>
  );
};
