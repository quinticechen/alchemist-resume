import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PricingPlan {
  name: string;
  planId: string;
  price: {
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

interface PricingCardProps {
  plan: PricingPlan;
  isAnnual: boolean;
  isLoading: boolean;
  onSelect: (planId: string) => void;
}

const PricingCard = ({ plan, isAnnual, isLoading, onSelect }: PricingCardProps) => {
  const price = isAnnual ? plan.price.annual : plan.price.monthly;
  const billingPeriod = isAnnual ? "/year" : "/month";
  
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
      
      <CardFooter className="pt-6">
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
      </CardFooter>
    </Card>
  );
};

export default PricingCard;
