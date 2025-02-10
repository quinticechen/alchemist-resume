
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import i18n from 'i18next';

export const useTranslations = () => {
  const { data: translations, isLoading } = useQuery({
    queryKey: ['translations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('translations')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (translations) {
      const resources: { [key: string]: { [key: string]: string } } = {};
      
      translations.forEach((translation) => {
        if (!resources[translation.language_code]) {
          resources[translation.language_code] = {};
        }
        
        const [namespace, key] = translation.key.split('.');
        if (!resources[translation.language_code][namespace]) {
          resources[translation.language_code][namespace] = {};
        }
        
        resources[translation.language_code][namespace][key] = translation.value;
      });

      Object.keys(resources).forEach((langCode) => {
        i18n.addResourceBundle(langCode, 'common', resources[langCode].common, true, true);
      });
    }
  }, [translations]);

  return { isLoading };
};
