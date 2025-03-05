
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PricingPlan } from "@/data/pricingPlans";
import { useEffect, useRef } from "react";

interface PricingCardProps {
  plan: PricingPlan;
  isAnnual: boolean;
  isLoading: boolean;
  onSelect: (planId: string) => void;
}

export const PricingCard = ({ plan, isAnnual, isLoading, onSelect }: PricingCardProps) => {
  const price = isAnnual ? plan.price.annual : plan.price.monthly;
  const billingPeriod = isAnnual ? "/year" : "/month";
  const stripeBuyButtonRef = useRef<HTMLDivElement>(null);
  
  // Get the appropriate Buy Button ID based on the plan and billing cycle
  const getBuyButtonId = () => {
    if (plan.planId === 'alchemist') {
      return isAnnual ? 'buy_btn_1QylBKGYVYFmwG4FNJM8Iuuy' : 'buy_btn_1QylA3GYVYFmwG4FMrFQJlHz';
    } else if (plan.planId === 'grandmaster') {
      return isAnnual ? 'buy_btn_1Qyl8pGYVYFmwG4FhZ9EFDJO' : 'buy_btn_1Qyl4ZGYVYFmwG4FG2AQZ2rS';
    }
    return '';
  };
  
  const buyButtonId = getBuyButtonId();
  const showStripeDirect = plan.planId !== 'apprentice' && buyButtonId;

  // Load Stripe Buy Button script dynamically
  useEffect(() => {
    if (showStripeDirect && stripeBuyButtonRef.current) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/buy-button.js';
      script.async = true;
      
      // Only add the script if it doesn't already exist
      if (!document.querySelector('script[src="https://js.stripe.com/v3/buy-button.js"]')) {
        document.body.appendChild(script);
      }
      
      // Clean up
      return () => {
        // Do not remove the script as it might be used by other components
      };
    }
  }, [showStripeDirect]);
  
  // Function to render Stripe Buy Button once the script is loaded
  const renderStripeBuyButton = () => {
    if (!showStripeDirect || !buyButtonId) return null;
    
    const scriptLoaded = typeof document !== 'undefined' && 
      document.querySelector('script[src="https://js.stripe.com/v3/buy-button.js"]');
    
    if (scriptLoaded) {
      return (
        // @ts-ignore - TypeScript doesn't know about this custom element
        <stripe-buy-button
          buy-button-id={buyButtonId}
          publishable-key="pk_test_51QoMVlGYVYFmwG4FYQ68QZ4salYBAwr7cSFzqypObpzyEDTZg9woA7v2xoUdwFFY9aks19KioxyCy3GTBAFUzMOd00N0xm7sdi"
        />
      );
    }
    
    return null;
  };
  
  return (
    <Card className={`flex flex-col h-full relative ${plan.highlighted ? 'border-primary shadow-lg' : ''}`}>
      {plan.mostPopular && (
        <Badge className="absolute right-4 top-4 bg-primary text-primary-foreground">
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="pb-8">
        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold">{price}</span>
          {price !== "$0" && <span className="text-neutral-500 ml-1">{billingPeriod}</span>}
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow space-y-4">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter className="pt-6 flex flex-col gap-3">
        {plan.showButton && (
          <Button
            className="w-full"
            variant={plan.highlighted ? "default" : "outline"}
            onClick={() => onSelect(plan.planId)}
            disabled={isLoading || plan.isCurrentPlan}
          >
            {isLoading ? "Processing..." : plan.isCurrentPlan ? "Current Plan" : plan.buttonText}
          </Button>
        )}
        
        {showStripeDirect && (
          <div className="w-full" ref={stripeBuyButtonRef}>
            {renderStripeBuyButton()}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default PricingCard;
