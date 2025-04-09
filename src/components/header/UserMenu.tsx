
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Session } from "@supabase/supabase-js";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
      <Link to="/account" className="flex items-center gap-3 text-neutral-600 hover:text-primary transition-colors">
        <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
          <AvatarFallback>{emailInitial}</AvatarFallback>
        </Avatar>
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
