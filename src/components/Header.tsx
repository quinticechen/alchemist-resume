
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import Logo from "./header/Logo";
import Navigation from "./header/Navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import UserMenu from "./header/UserMenu";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Header = () => {
  const { session, signOut } = useAuth();
  const { t } = useTranslation();
  const isHome = window.location.pathname === '/';

  const handleSupportedWebsitesClick = () => {
    // Scroll to websites section or navigate to it
    const websitesSection = document.getElementById('supported-websites');
    if (websitesSection) {
      websitesSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If not on home page, navigate to home with anchor
      window.location.href = '/#supported-websites';
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-background border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Logo />
        
        <Navigation 
          session={session} 
          onSupportedWebsitesClick={handleSupportedWebsitesClick} 
          isHome={isHome}
        />
        
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          
          {session ? (
            <UserMenu 
              session={session} 
              onLogout={handleSignOut}
            />
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm">
                {t('common.signIn')}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
