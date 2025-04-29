
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import Logo from "./header/Logo";
import Navigation from "./header/Navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import UserMenu from "./header/UserMenu";
import { Link } from "react-router-dom";

const Header = () => {
  const { session, signOut, isLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isHome = location.pathname === '/';
  const isLogin = location.pathname === '/login';

  const scrollToSupportedWebsites = () => {
    const element = document.getElementById('supported-websites');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else if (!isHome) {
      navigate('/#supported-websites');
    }
  };

  const handleAuthClick = () => {
    if (session) {
      navigate("/alchemist-workshop");
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Logo />
            <Navigation 
              session={session} 
              onSupportedWebsitesClick={scrollToSupportedWebsites}
              isHome={isHome}
            />
          </div>
          <div className="flex items-center gap-6">
            {/* <LanguageSwitcher /> */}
            
            {!isLoading && (
              session ? (
                <UserMenu 
                  session={session}
                  onLogout={signOut}
                />
              ) : !isLogin && (
                <Button
                  onClick={handleAuthClick}
                  size="sm"
                  className="flex items-center gap-2 bg-gradient-primary hover:opacity-90 transition-opacity"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">{isHome ? "Start Free Trial" : "Sign In"}</span>
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
