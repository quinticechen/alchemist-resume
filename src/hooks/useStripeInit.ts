
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";

export const useStripeInit = () => {
  const [isStripeInitializing, setIsStripeInitializing] = useState(true);
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      setIsStripeInitializing(true);
      const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      
      if (!publishableKey) {
        console.error('Stripe publishable key is not set');
        setIsStripeInitializing(false);
        return;
      }

      try {
        const stripe = await loadStripe(publishableKey);
        if (stripe) {
          setStripePromise(stripe);
        }
      } catch (error) {
        console.error('Error initializing Stripe:', error);
      } finally {
        setIsStripeInitializing(false);
      }
    };

    initializeStripe();
  }, []);

  return { isStripeInitializing, stripePromise };
};
