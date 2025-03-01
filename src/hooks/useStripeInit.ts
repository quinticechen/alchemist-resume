

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "@/integrations/supabase/client";

export const useStripeInit = () => {
  const [isStripeInitializing, setIsStripeInitializing] = useState(true);
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      setIsStripeInitializing(true);
      try {
        console.log('Initiating request to get-stripe-key function');
        
        const { data, error } = await supabase.functions.invoke('get-stripe-key', {
          method: 'GET'
        });

        if (error) {
          console.error('Error invoking get-stripe-key function:', error);
          throw error;
        }

        if (!data?.publishableKey) {
          console.error('No publishable key in response:', data);
          throw new Error('No publishable key received from server');
        }

        console.log('Successfully received publishable key, initializing Stripe');
        const stripe = await loadStripe(data.publishableKey);
        
        if (!stripe) {
          throw new Error('Failed to initialize Stripe - stripe object is null');
        }

        console.log('Stripe initialized successfully');
        setStripePromise(stripe);
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
