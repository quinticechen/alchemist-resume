export const SUPPORTED_LANGUAGES = ['en', 'zh-CN', 'zh-TW', 'ja', 'es', 'ko'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const getLanguageFromPath = (pathname: string): SupportedLanguage | null => {
  const segments = pathname.split('/').filter(Boolean);
  const potentialLang = segments[0];
  
  if (SUPPORTED_LANGUAGES.includes(potentialLang as SupportedLanguage)) {
    return potentialLang as SupportedLanguage;
  }
  
  return null;
};

export const removeLanguageFromPath = (pathname: string): string => {
  const lang = getLanguageFromPath(pathname);
  if (lang) {
    return pathname.replace(`/${lang}`, '') || '/';
  }
  return pathname;
};

export const addLanguageToPath = (pathname: string, language: SupportedLanguage): string => {
  const cleanPath = removeLanguageFromPath(pathname);
  return `/${language}${cleanPath === '/' ? '' : cleanPath}`;
};

export const getDefaultLanguage = (): SupportedLanguage => {
  // Try to detect from browser
  const browserLang = navigator.language;
  
  // Map browser language to supported languages
  const langMap: Record<string, SupportedLanguage> = {
    'zh-CN': 'zh-CN',
    'zh-Hans': 'zh-CN',
    'zh': 'zh-CN',
    'zh-TW': 'zh-TW',
    'zh-Hant': 'zh-TW',
    'ja': 'ja',
    'ja-JP': 'ja',
    'es': 'es',
    'es-ES': 'es',
    'ko': 'ko',
    'ko-KR': 'ko'
  };
  
  // Check exact match first
  if (SUPPORTED_LANGUAGES.includes(browserLang as SupportedLanguage)) {
    return browserLang as SupportedLanguage;
  }
  
  // Check mapped languages
  if (langMap[browserLang]) {
    return langMap[browserLang];
  }
  
  // Check language prefix (e.g., 'zh' from 'zh-HK')
  const langPrefix = browserLang.split('-')[0];
  if (langMap[langPrefix]) {
    return langMap[langPrefix];
  }
  
  return 'en';
};

export const generateHreflangUrls = (
  currentPath: string, 
  baseUrl: string = 'https://resumealchemist.qwizai.com'
): Array<{ lang: string; url: string }> => {
  const cleanPath = removeLanguageFromPath(currentPath);
  
  return SUPPORTED_LANGUAGES.map(lang => ({
    lang: lang === 'en' ? 'en' : lang,
    url: `${baseUrl}${lang === 'en' ? cleanPath : addLanguageToPath(cleanPath, lang)}`
  }));
};