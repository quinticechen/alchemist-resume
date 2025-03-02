
export interface PricingPlan {
  name: string;
  planId: string;
  price: {
    monthly: string;
    annual: string;
  };
  priceId: {
    monthly: string;
    annual: string;
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
      monthly: "",
      annual: "",
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
      monthly: "price_1Qs0CVGYVYFmwG4FmEwa1iWO",
      annual: "price_1Qs0ECGYVYFmwG4FluFhUdQH",
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
      monthly: "price_1Qs0BTGYVYFmwG4FFDbYpi5v",
      annual: "price_1Qs0BtGYVYFmwG4FrtkMrNNx",
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
