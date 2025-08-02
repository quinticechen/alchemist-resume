
import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { currentLanguage, availableLanguages, changeLanguage, getCurrentLanguage, isLoading } = useLanguage();

  if (isLoading) {
    return (
      <div className="w-[140px] h-10 bg-muted rounded-md animate-pulse" />
    );
  }

  const currentLangData = getCurrentLanguage();

  return (
    <Select value={currentLanguage} onValueChange={changeLanguage}>
      <SelectTrigger className="w-[140px]">
        <Globe className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Language">
          {currentLangData?.language_name_native || currentLanguage}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableLanguages.map((lang) => (
          <SelectItem key={lang.language_code} value={lang.language_code}>
            <div className="flex items-center gap-2">
              <span>{lang.language_name_native}</span>
              <span className="text-xs text-muted-foreground">
                {lang.language_name_english}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSwitcher;
