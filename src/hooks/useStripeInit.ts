
import { useEffect, useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { supabase } from "../integrations/supabase/client";
import { toast } from "../hooks/use-toast";
import { getEnvironment } from "@/integrations/supabase/client";

export const useStripeInit = () => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isStripeInitializing, setIsStripeInitializing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<number>(0);
  const maxAttempts = 3;
  const environment = getEnvironment();

  useEffect(() => {
    const initStripe = async () => {
      try {
        setIsStripeInitializing(true);
        console.log(`Initializing Stripe in ${environment} environment (attempt ${attempts + 1}/${maxAttempts})`);
        
        // Add environment to headers
        const { data, error: funcError } = await supabase.functions.invoke("get-stripe-key", {
          headers: {
            'x-environment': environment
          }
        });
        
        if (funcError) {
          console.error("Error invoking get-stripe-key function:", funcError);
          throw new Error(funcError.message || "Failed to initialize payment system");
        }
        
        if (!data || !data.key) {
          console.error("No Stripe key returned from function");
          throw new Error("Payment system configuration error: No key returned");
        }
        
        console.log(`Successfully got Stripe key for ${environment} environment`);
        const stripeInstance = loadStripe(data.key);
        setStripePromise(stripeInstance);
        setError(null);
      } catch (err: any) {
        console.error(`Stripe initialization failed (attempt ${attempts + 1}/${maxAttempts}):`, err);
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
  }, [attempts, environment]);

  return { stripePromise, isStripeInitializing, error };
};

export default useStripeInit;
