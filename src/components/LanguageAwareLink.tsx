import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getLanguageFromPath, addLanguageToPath, getDefaultLanguage } from '@/utils/languageRouting';

interface LanguageAwareLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  replace?: boolean;
}

export const LanguageAwareLink: React.FC<LanguageAwareLinkProps> = ({ 
  to, 
  children, 
  className,
  replace = false 
}) => {
  const location = useLocation();
  
  // Get current language from URL
  const currentLang = getLanguageFromPath(location.pathname) || getDefaultLanguage();
  
  // Create language-aware path
  const languageAwarePath = addLanguageToPath(to, currentLang as any);
  
  return (
    <Link to={languageAwarePath} className={className} replace={replace}>
      {children}
    </Link>
  );
};

export default LanguageAwareLink;