
import { getEnvironment } from '@/integrations/supabase/client';

export interface PricingPlan {
  name: string;
  planId: string;
  price: {
    monthly: string;
    annual: string;
  };
  priceId: {
    monthly: {
      production: string;
      staging: string;
    };
    annual: {
      production: string;
      staging: string;
    };
  };
  features: string[];
  buttonText: string;
  highlighted: boolean;
  showButton: boolean;
  isCurrentPlan?: boolean;
  mostPopular?: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    name: "Apprentice",
    planId: "apprentice",
    price: {
      monthly: "$0",
      annual: "$0",
    },
    priceId: {
      monthly: {
        production: "",
        staging: "",
      },
      annual: {
        production: "",
        staging: "",
      },
    },
    features: [
      "3 Resume Customizations",
      "Basic AI Analysis",
      "PDF Format Support",
    ],
    buttonText: "Start Free Trial",
    highlighted: false,
    showButton: false, // This will be dynamically set based on auth status
  },
  {
    name: "Alchemist",
    planId: "alchemist",
    price: {
      monthly: "$39.99",
      annual: "$359.99",
    },
    priceId: {
      monthly: {
        production: "price_1R4woGGYVYFmwG4FMr8genM9", // Production Monthly Alchemist
        staging: "price_1Qs0CVGYVYFmwG4FmEwa1iWO", // Staging Monthly Alchemist
      },
      annual: {
        production: "price_1R4wlsGYVYFmwG4F9amzotAs", // Production Annual Alchemist
        staging: "price_1Qs0ECGYVYFmwG4FluFhUdQH", // Staging Annual Alchemist
      },
    },
    features: [
      "Everything in Apprentice plan",
      "30 uses per Month",
      "Advanced AI Analysis",
      "Multiple Resume Versions",
      "Resume Performance Analytics",
    ],
    buttonText: "Get Alchemist",
    highlighted: false,
    showButton: true,
    mostPopular: true,
  },
  {
    name: "Grandmaster",
    planId: "grandmaster",
    price: {
      monthly: "$99.99",
      annual: "$899.99",
    },
    priceId: {
      monthly: {
        production: "price_1R4wolGYVYFmwG4FJZIGms32", // Production Monthly Grandmaster
        staging: "price_1Qs0BTGYVYFmwG4FFDbYpi5v", // Staging Monthly Grandmaster
      },
      annual: {
        production: "price_1R4woYGYVYFmwG4F7lMm9pKK", // Production Annual Grandmaster
        staging: "price_1Qs0BtGYVYFmwG4FrtkMrNNx", // Staging Annual Grandmaster
      },
    },
    features: [
      "Everything in Alchemist plan",
      "Unlimited uses",
      "Interview Tips",
      "Priority Support",
      "Early access to new features",
    ],
    buttonText: "Get Grandmaster",
    highlighted: true,
    showButton: true,
  },
];

// Helper function to get the correct price ID based on environment
export function getPriceId(plan: PricingPlan, isAnnual: boolean): string {
  const env = getEnvironment() === 'production' ? 'production' : 'staging';
  return isAnnual ? plan.priceId.annual[env] : plan.priceId.monthly[env];
}
