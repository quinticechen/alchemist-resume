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
      try {
        const currentPath = location.pathname;
        const langFromPath = getLanguageFromPath(currentPath);
        
        console.log('LanguageRouter: Current path:', currentPath, 'Language from path:', langFromPath);
        
        // If we're at the root path without language, redirect to default language
        if (currentPath === '/') {
          const defaultLang = getDefaultLanguage();
          navigate(`/${defaultLang}`, { replace: true });
          if (i18n.language !== defaultLang) {
            await i18n.changeLanguage(defaultLang);
            console.log('LanguageRouter: Changed to default language:', defaultLang);
          }
          setIsInitialized(true);
          return;
        }

        // If we have a language in the path, use it
        if (langFromPath && SUPPORTED_LANGUAGES.includes(langFromPath as any)) {
          console.log('LanguageRouter: Setting language to:', langFromPath);
          if (i18n.language !== langFromPath) {
            await i18n.changeLanguage(langFromPath);
            
            // Force reload resources for this language
            await i18n.loadLanguages(langFromPath);
            await i18n.reloadResources(langFromPath, ['common', 'home', 'hero']);
            
            console.log('LanguageRouter: Language changed to:', langFromPath);
          }
        } else if (!langFromPath) {
          // If no language in path but we're not at root, redirect to include language
          const currentLang = i18n.language && SUPPORTED_LANGUAGES.includes(i18n.language as any) 
            ? i18n.language 
            : getDefaultLanguage();
          
          const newPath = addLanguageToPath(currentPath, currentLang as any);
          navigate(newPath, { replace: true });
          if (i18n.language !== currentLang) {
            await i18n.changeLanguage(currentLang);
            console.log('LanguageRouter: Redirected and changed to:', currentLang);
          }
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing language routing:', error);
        setIsInitialized(true); // Still set to true to prevent infinite loading
      }
    };

    initializeLanguageRouting();
  }, [location.pathname, navigate, i18n]);

  // Listen for language changes and update URL
  useEffect(() => {
    if (!isInitialized) return;

    const handleLanguageChange = async (lng: string) => {
      const currentPath = location.pathname;
      const currentLang = getLanguageFromPath(currentPath);
      
      if (currentLang !== lng && SUPPORTED_LANGUAGES.includes(lng as any)) {
        const pathWithoutLang = removeLanguageFromPath(currentPath);
        const newPath = addLanguageToPath(pathWithoutLang, lng as any);
        navigate(newPath, { replace: true });
        
        // Resources should already be preloaded, so this should be instant
        console.log('LanguageRouter: Quick language switch to:', lng);
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