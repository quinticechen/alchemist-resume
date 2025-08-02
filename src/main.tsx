
import React from 'react';
import { createRoot } from 'react-dom/client';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import App from './App.tsx';
import './index.css';

// Initialize i18next with enhanced configuration for better performance
i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    // Language detection
    detection: {
      order: ['path', 'localStorage', 'navigator', 'htmlTag'],
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
      caches: ['localStorage'],
      lookupLocalStorage: 'language'
    },

    // Backend configuration for loading translations
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      requestOptions: {
        cache: 'no-store'
      },
      allowMultiLoading: true, // Enable loading multiple files at once
      crossDomain: false
    },

    // Namespaces
    ns: ['common', 'home', 'hero'],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false,
    },

    // Language codes mapping - keep exact codes
    supportedLngs: ['en', 'zh-CN', 'zh-TW', 'ja'],
    load: 'all',
    nonExplicitSupportedLngs: false,
    
    // Preload all supported languages for instant switching
    preload: ['en', 'zh-CN', 'zh-TW', 'ja'],
    
    // Initialize immediately for better performance
    initImmediate: false,
    
    // Comprehensive fallback resources (embedded for instant loading)
    resources: {
      en: {
        common: {
          navigation: {
            workshop: 'Workshop',
            records: 'Records',
            pricing: 'Pricing',
            faq: 'FAQ',
            supportedWebsites: 'Supported Websites'
          },
          auth: {
            signIn: 'Sign In',
            signOut: 'Sign Out'
          },
          subscription: {
            usesLeft: '{{count}} uses left',
            startFreeTrial: 'Start Free Trial'
          }
        },
        home: {
          hero: {
            title: 'Transform Your Resume with AI Alchemy',
            subtitle: 'Turn your ordinary resume into the perfect match for your dream job using our AI-powered optimization technology.'
          },
          faq: {
            title: 'Frequently Asked Questions',
            questions: [
              {
                question: 'How many free uses do I get?',
                answer: 'New users receive 3 free uses to try our service.'
              },
              {
                question: 'What file formats are supported?',
                answer: 'Currently, we support PDF format for resume uploads.'
              },
              {
                question: 'How long does the process take?',
                answer: 'The optimization process typically takes 2-3 minutes.'
              }
            ]
          }
        }
      },
      'zh-CN': {
        common: {
          navigation: {
            workshop: '工作坊',
            records: '记录',
            pricing: '价格',
            faq: '常见问题',
            supportedWebsites: '支持的网站'
          },
          auth: {
            signIn: '登录',
            signOut: '登出'
          },
          subscription: {
            usesLeft: '剩余 {{count}} 次使用',
            startFreeTrial: '开始免费试用'
          }
        }
      },
      'zh-TW': {
        common: {
          navigation: {
            workshop: '工作坊',
            records: '記錄',
            pricing: '價格',
            faq: '常見問題',
            supportedWebsites: '支援的網站'
          },
          auth: {
            signIn: '登入',
            signOut: '登出'
          },
          subscription: {
            usesLeft: '剩餘 {{count}} 次使用',
            startFreeTrial: '開始免費試用'
          }
        }
      },
      ja: {
        common: {
          navigation: {
            workshop: 'ワークショップ',
            records: '記録',
            pricing: '料金',
            faq: 'よくある質問',
            supportedWebsites: '対応サイト'
          },
          auth: {
            signIn: 'ログイン',
            signOut: 'ログアウト'
          },
          subscription: {
            usesLeft: '残り{{count}}回',
            startFreeTrial: '無料トライアル開始'
          }
        }
      }
    }
  });

const root = createRoot(document.getElementById("root")!);
root.render(
  <App />
);
