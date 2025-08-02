import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LanguageMetadata {
  language_code: string;
  language_name_native: string;
  language_name_english: string;
  direction: 'ltr' | 'rtl';
  is_active: boolean;
  sort_order: number;
}

export const useLanguage = () => {
  const { i18n } = useTranslation();
  const { session } = useAuth();
  const [availableLanguages, setAvailableLanguages] = useState<LanguageMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch available languages
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const { data, error } = await supabase
          .from('language_metadata')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (error) throw error;
        setAvailableLanguages(data || []);
      } catch (error) {
        console.error('Error fetching languages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  // Load user language preference
  useEffect(() => {
    const loadUserLanguagePreference = async () => {
      if (!session?.user) return;

      try {
        const { data, error } = await supabase
          .from('user_language_preferences')
          .select('preferred_language')
          .eq('user_id', session.user.id)
          .single();

        if (data && data.preferred_language) {
          i18n.changeLanguage(data.preferred_language);
        }
      } catch (error) {
        // User preference not found, use browser detection or default
        const browserLang = navigator.language.split('-')[0];
        const supportedLang = availableLanguages.find(
          lang => lang.language_code.startsWith(browserLang)
        );
        if (supportedLang) {
          i18n.changeLanguage(supportedLang.language_code);
        }
      }
    };

    if (availableLanguages.length > 0) {
      loadUserLanguagePreference();
    }
  }, [session?.user, availableLanguages, i18n]);

  const changeLanguage = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      localStorage.setItem('language', languageCode);

      // Save user preference if authenticated
      if (session?.user) {
        await supabase
          .from('user_language_preferences')
          .upsert({
            user_id: session.user.id,
            preferred_language: languageCode,
            fallback_language: 'en'
          });
      }
      
      // URL will be updated automatically by LanguageRouter component
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const getCurrentLanguage = () => {
    return availableLanguages.find(lang => lang.language_code === i18n.language);
  };

  return {
    currentLanguage: i18n.language,
    availableLanguages,
    changeLanguage,
    getCurrentLanguage,
    isLoading
  };
};