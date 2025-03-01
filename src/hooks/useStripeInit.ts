
import { useEffect, useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { supabase } from "../integrations/supabase/client";
import { toast } from "../hooks/use-toast";

export const useStripeInit = () => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initStripe = async () => {
      try {
        console.info("Initiating request to get-stripe-key function");
        setLoading(true);
        
        const { data, error } = await supabase.functions.invoke("get-stripe-key");
        
        if (error) {
          console.error("Error invoking get-stripe-key function:", error);
          setError("Failed to initialize payment system");
          toast({
            title: "Payment System Error",
            description: "Unable to initialize payment system. Please try again later.",
            variant: "destructive",
          });
          return;
        }
        
        if (!data || !data.key) {
          console.error("No Stripe key returned from function");
          setError("Payment system configuration error");
          toast({
            title: "Payment System Error",
            description: "Payment system is not properly configured. Please try again later.",
            variant: "destructive",
          });
          return;
        }
        
        const stripeInstance = loadStripe(data.key);
        setStripePromise(stripeInstance);
        console.info("Stripe initialized successfully");
      } catch (err) {
        console.error("Error initializing Stripe:", err);
        setError("Failed to initialize payment system");
        toast({
          title: "Payment System Error",
          description: "An unexpected error occurred. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initStripe();
  }, []);

  return { stripePromise, loading, error, isStripeInitializing: loading };
};

export default useStripeInit;
