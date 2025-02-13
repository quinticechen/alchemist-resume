
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
        console.error('Stripe publishable key is not set in environment variables');
        setIsStripeInitializing(false);
        return;
      }

      console.log('Initializing Stripe with publishable key:', publishableKey);

      try {
        const stripe = await loadStripe(publishableKey);
        if (stripe) {
          console.log('Stripe initialized successfully');
          setStripePromise(stripe);
        } else {
          console.error('Failed to initialize Stripe - stripe object is null');
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
