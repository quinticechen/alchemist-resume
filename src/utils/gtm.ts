
// Declare gtag as a global function
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const trackLogin = (method: string) => {
  if (window.gtag) {
    window.gtag("event", "login", {
      method: method
    });
  }
};

export const trackSignUp = (method: string) => {
  if (window.gtag) {
    window.gtag("event", "sign_up", {
      method: method
    });
  }
};

export const trackBeginCheckout = (
  planId: string, 
  isAnnual: boolean
) => {
  if (!window.gtag) return;

  const plans = {
    alchemist: {
      monthly: {
        item_id: "1",
        item_name: "Monthly Alchemist",
        value: 39.99
      },
      annual: {
        item_id: "3",
        item_name: "Annual Alchemist",
        value: 359.99
      }
    },
    grandmaster: {
      monthly: {
        item_id: "2",
        item_name: "Monthly Grandmaster",
        value: 99.99
      },
      annual: {
        item_id: "4",
        item_name: "Annual Grandmaster",
        value: 899.99
      }
    }
  };

  const plan = planId === 'grandmaster' 
    ? plans.grandmaster 
    : plans.alchemist;

  const selectedPlan = isAnnual ? plan.annual : plan.monthly;

  window.gtag("event", "begin_checkout", {
    currency: "USD",
    value: selectedPlan.value,
    items: [{
      item_id: selectedPlan.item_id,
      item_name: selectedPlan.item_name,
    }]
  });
};
