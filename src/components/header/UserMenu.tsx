
import { Session } from "@supabase/supabase-js";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface UserMenuProps {
  session: Session;
  usageCount?: number;
  onLogout: () => Promise<void>;
}

const UserMenu = ({ session, onLogout }: UserMenuProps) => {
  // Get the first letter of email for avatar fallback
  const emailInitial = session.user.email ? session.user.email[0].toUpperCase() : 'U';
  
  return (
    <div className="flex items-center gap-3">
      <Link to="/account" className="flex items-center gap-2">
        <Avatar className="h-8 w-8 border border-neutral-200">
          <AvatarFallback>{emailInitial}</AvatarFallback>
        </Avatar>
      </Link>
      <Button
        variant="outline"
        size="sm"
        onClick={onLogout}
        className="border-neutral-200"
      >
        Sign Out
      </Button>
    </div>
  );
};

export default UserMenu;
