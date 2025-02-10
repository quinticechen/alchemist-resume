
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Session } from "@supabase/supabase-js";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserMenuProps {
  session: Session;
  usageCount: number;
  onLogout: () => Promise<void>;
}

const UserMenu = ({ session, usageCount, onLogout }: UserMenuProps) => {
  const [remainingUses, setRemainingUses] = useState<number>(0);
  const [freeTrialLimit, setFreeTrialLimit] = useState<number>(3);

  useEffect(() => {
    const getFreeTrialLimit = async () => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('free_trial_limit')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching free trial limit:', error);
        return;
      }

      if (profile) {
        setFreeTrialLimit(profile.free_trial_limit);
        setRemainingUses(Math.max(0, profile.free_trial_limit - (usageCount || 0)));
      }
    };

    getFreeTrialLimit();
  }, [session.user.id, usageCount]);

  return (
    <div className="flex items-center gap-3">
      <Link to="/account" className="flex items-center gap-3 text-neutral-600 hover:text-primary transition-colors">
        <User className="h-5 w-5" />
        <span className="text-sm hidden sm:inline">
          {session.user.email}
        </span>
        <span className="text-sm font-medium text-primary">
          ({remainingUses} {remainingUses === 1 ? 'use' : 'uses'} left)
        </span>
      </Link>
      <Button
        variant="outline"
        size="sm"
        onClick={onLogout}
        className="flex items-center gap-2 border-neutral-200 hover:bg-neutral-100"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Sign Out</span>
      </Button>
    </div>
  );
};

export default UserMenu;
