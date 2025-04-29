
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../Logo";
import Navigation from "./Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Session } from "@supabase/supabase-js";

interface UserMenuProps {
  session: Session;
  onLogout: () => void;
}

const UserMenu = ({ session, onLogout }: UserMenuProps) => {
  const userEmail = session?.user?.email;
  const initials = userEmail ? userEmail.substring(0, 2).toUpperCase() : "??";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarImage src={session?.user?.user_metadata?.avatar_url || ""} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/alchemist-workshop">Workshop</a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/alchemy-records">Records</a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/account">Settings</a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
