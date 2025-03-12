import { useEffect, useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { supabase } from "../integrations/supabase/client";
import { toast } from "../hooks/use-toast";

export const useStripeInit = () => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isStripeInitializing, setIsStripeInitializing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<number>(0);
  const maxAttempts = 3;

  useEffect(() => {
    const initStripe = async () => {
      try {
        // console.info(`Initiating request to get-stripe-key function (attempt ${attempts + 1}/${maxAttempts})`);
        setIsStripeInitializing(true);
        
        const { data, error: funcError } = await supabase.functions.invoke("get-stripe-key");
        
        if (funcError) {
          console.error("Error invoking get-stripe-key function:", funcError);
          throw new Error(funcError.message || "Failed to initialize payment system");
        }
        
        if (!data || !data.key) {
          // console.error("No Stripe key returned from function:", data);
          throw new Error("Payment system configuration error: No key returned");
        }
        
        const stripeInstance = loadStripe(data.key);
        setStripePromise(stripeInstance);
        setError(null);
        // console.info("Stripe initialized successfully with key:", data.key.substring(0, 8) + "...");
      } catch (err: any) {
        // console.error("Error initializing Stripe:", err);
        setError(err.message || "Failed to initialize payment system");
        
        // Only show toast on final attempt
        if (attempts >= maxAttempts - 1) {
          toast({
            title: "Payment System Error",
            description: "Unable to initialize payment system. Please ensure you have set up your Stripe configuration.",
            variant: "destructive",
          });
        } else {
          // Try again if we haven't reached max attempts
          setTimeout(() => {
            setAttempts(prev => prev + 1);
          }, 1000 * (attempts + 1)); // Progressive backoff
        }
      } finally {
        setIsStripeInitializing(false);
      }
    };

    if (attempts < maxAttempts && !stripePromise && error === null) {
      initStripe();
    }
  }, [attempts]);

  return { stripePromise, isStripeInitializing, error };
};

export default useStripeInit;
