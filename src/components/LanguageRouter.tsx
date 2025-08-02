import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLanguageFromPath, removeLanguageFromPath, addLanguageToPath, getDefaultLanguage, SUPPORTED_LANGUAGES } from '@/utils/languageRouting';

interface LanguageRouterProps {
  children: React.ReactNode;
}

export const LanguageRouter: React.FC<LanguageRouterProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeLanguageRouting = async () => {
      const currentPath = location.pathname;
      const langFromPath = getLanguageFromPath(currentPath);
      
      // If we're at the root path without language, redirect to default language
      if (currentPath === '/') {
        const defaultLang = getDefaultLanguage();
        navigate(`/${defaultLang}`, { replace: true });
        await i18n.changeLanguage(defaultLang);
        setIsInitialized(true);
        return;
      }

      // If we have a language in the path, use it
      if (langFromPath) {
        if (i18n.language !== langFromPath) {
          await i18n.changeLanguage(langFromPath);
        }
      } else {
        // If no language in path but we're not at root, redirect to include language
        const currentLang = i18n.language || getDefaultLanguage();
        const supportedLang = SUPPORTED_LANGUAGES.includes(currentLang as any) 
          ? currentLang 
          : getDefaultLanguage();
        
        const newPath = addLanguageToPath(currentPath, supportedLang as any);
        navigate(newPath, { replace: true });
        await i18n.changeLanguage(supportedLang);
      }
      
      setIsInitialized(true);
    };

    initializeLanguageRouting();
  }, [location.pathname, navigate, i18n]);

  // Listen for language changes and update URL
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      if (!isInitialized) return;
      
      const currentPath = location.pathname;
      const currentLang = getLanguageFromPath(currentPath);
      
      if (currentLang !== lng) {
        const pathWithoutLang = removeLanguageFromPath(currentPath);
        const newPath = addLanguageToPath(pathWithoutLang, lng as any);
        navigate(newPath, { replace: true });
      }
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [location.pathname, navigate, i18n, isInitialized]);

  // Show loading state until language routing is initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default LanguageRouter;