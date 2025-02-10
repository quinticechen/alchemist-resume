
import { Link } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";

interface NavigationProps {
  session: Session | null;
  onSupportedWebsitesClick: () => void;
  isHome: boolean;
}

const Navigation = ({ session, onSupportedWebsitesClick, isHome }: NavigationProps) => {
  const { t } = useTranslation();

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
                {t('common.workshop')}
              </Link>
            </li>
            <li>
              <Link
                to="/alchemy-records"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors"
              >
                {t('common.records')}
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
                  {t('common.supportedWebsites')}
                </button>
              </li>
            ) : null}
            <li>
              <Link
                to="/pricing"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors"
              >
                {t('common.pricing')}
              </Link>
            </li>
            <li>
              <Link
                to="/faq"
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors"
              >
                {t('common.faq')}
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navigation;
