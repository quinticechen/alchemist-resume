import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserMenuProps {
  session: Session;
  usageCount: number;
  onLogout: () => Promise<void>;
}

const UserMenu = ({ session, usageCount, onLogout }: UserMenuProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-3 text-neutral-600">
        <User className="h-5 w-5" />
        <span className="text-sm hidden sm:inline">
          {session.user.email}
        </span>
        <span className="text-sm font-medium text-primary">
          ({3 - (usageCount || 0)} uses left)
        </span>
      </div>
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