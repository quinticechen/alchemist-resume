import { Link } from "react-router-dom";
import { Session } from "@supabase/supabase-js";

interface NavigationProps {
  session: Session | null;
  onSupportedWebsitesClick: () => void;
  isHome: boolean;
}

const Navigation = ({ session, onSupportedWebsitesClick, isHome }: NavigationProps) => {
  return (
    <nav>
      <ul className="flex items-center gap-6">
        {session ? (
          <>
            <li>
              <Link
                to="/alchemist-workshop"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors"
              >
                Workshop
              </Link>
            </li>
            <li>
              <Link
                to="/alchemy-records"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors"
              >
                Records
              </Link>
            </li>
          </>
        ) : (
          <>
            {isHome ? (
              <li>
                <button
                  onClick={onSupportedWebsitesClick}
                  className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors"
                >
                  Supported Websites
                </button>
              </li>
            ) : null}
            <li>
              <Link
                to="/pricing"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors"
              >
                Pricing
              </Link>
            </li>
            <li>
              <Link
                to="/faq"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors"
              >
                FAQ
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navigation;