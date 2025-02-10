
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
      const resources: { [key: string]: { translation: { [key: string]: string } } } = {};
      
      translations.forEach((translation) => {
        if (!resources[translation.language_code]) {
          resources[translation.language_code] = { translation: {} };
        }
        
        resources[translation.language_code].translation[translation.key] = translation.value;
      });

      Object.keys(resources).forEach((langCode) => {
        i18n.addResourceBundle(langCode, 'translation', resources[langCode].translation, true, true);
      });
    }
  }, [translations]);

  return { isLoading };
};
