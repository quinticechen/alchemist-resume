
import React from 'react';
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface UsageStatsProps {
  usageCount: number;
}

const UsageStats = ({ usageCount }: UsageStatsProps) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('apprentice');
  const [remainingUses, setRemainingUses] = useState<string | number>(0);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, monthly_usage_count')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setSubscriptionStatus(profile.subscription_status);
        
        // Calculate remaining uses based on subscription
        if (profile.subscription_status === 'grandmaster') {
          setRemainingUses('∞');
        } else if (profile.subscription_status === 'alchemist') {
          setRemainingUses(Math.max(0, 30 - (profile.monthly_usage_count || 0)));
        } else {
          setRemainingUses(Math.max(0, 3 - usageCount));
        }
      }
    };

    fetchSubscriptionStatus();
  }, [usageCount]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-apple mb-8">
      <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
      <p className="text-neutral-600">
        {subscriptionStatus === 'apprentice' ? (
          `Remaining Free Uses: ${remainingUses}`
        ) : subscriptionStatus === 'alchemist' ? (
          `Remaining Monthly Uses: ${remainingUses}`
        ) : (
          'Unlimited Uses Available'
        )}
      </p>
    </div>
  );
};

export default UsageStats;
