import { Link } from "react-router-dom";
import { Session } from "@supabase/supabase-js";

interface NavigationProps {
  session: Session | null;
  onSupportedWebsitesClick: () => void;
  isHome: boolean;
}

const Navigation = ({ session, onSupportedWebsitesClick, isHome }: NavigationProps) => {
  return (
    <nav className="hidden sm:flex items-center gap-4 text-sm text-neutral-600">
      <Link 
        to="/" 
        className="hover:text-neutral-900 transition-colors"
      >
        Home
      </Link>
      <button
        onClick={onSupportedWebsitesClick}
        className="hover:text-neutral-900 transition-colors"
      >
        Supported Websites
      </button>
      <Link 
        to="/pricing" 
        className="hover:text-neutral-900 transition-colors"
      >
        Pricing
      </Link>
      {session && (
        <>
          <Link 
            to="/alchemist-workshop" 
            className="hover:text-neutral-900 transition-colors"
          >
            Alchemist Workshop
          </Link>
          <Link 
            to="/alchemy-records" 
            className="hover:text-neutral-900 transition-colors"
          >
            Alchemy Records
          </Link>
        </>
      )}
    </nav>
  );
};

export default Navigation;