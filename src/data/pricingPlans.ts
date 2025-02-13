
export const pricingPlans = [
  {
    name: "Apprentice",
    planId: "apprentice",
    price: {
      monthly: "$0",
      annual: "$0",
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
  },
  {
    name: "Grandmaster",
    planId: "grandmaster",
    price: {
      monthly: "$99.99",
      annual: "$899.99",
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
    mostPopular: true,
  },
];
