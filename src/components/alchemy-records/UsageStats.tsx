
import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UsageStatsProps {
  usageCount: number;
}

const UsageStats = ({ usageCount }: UsageStatsProps) => {
  const { t } = useTranslation('records');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('apprentice');
  const [remainingUses, setRemainingUses] = useState<string | number>(0);
  const [totalResumes, setTotalResumes] = useState<number>(0);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, monthly_usage_count, free_trial_limit, usage_count')
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
          // For apprentice, use free_trial_limit - usage_count
          setRemainingUses(Math.max(0, (profile.free_trial_limit || 3) - (profile.usage_count || 0)));
        }
      }
      
      // Get total number of Golden resumes (with google_doc_url)
      const { count } = await supabase
        .from('resume_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .not('google_doc_url', 'is', null);
      
      if (count !== null) {
        setTotalResumes(count);
      }
    };

    fetchSubscriptionStatus();
  }, [usageCount]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-apple mb-8">
      <h2 className="text-xl font-semibold mb-4">{t('usageStats.title')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-neutral-600">{t('usageStats.totalGoldenResumes')}: <strong>{totalResumes}</strong></span>
        </div>
        <div className="text-neutral-600">
          {subscriptionStatus === 'apprentice' ? (
            `${t('usageStats.remainingFreeUses')}: ${remainingUses}`
          ) : subscriptionStatus === 'alchemist' ? (
            `${t('usageStats.remainingMonthlyUses')}: ${remainingUses}`
          ) : (
            t('usageStats.unlimitedUses')
          )}
        </div>
      </div>
    </div>
  );
};

export default UsageStats;
