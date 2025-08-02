
import React from 'react';
import { createRoot } from 'react-dom/client';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import App from './App.tsx';
import './index.css';

// Initialize i18next with enhanced configuration
i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    // Language detection
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language'
    },

    // Backend configuration for loading translations
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Namespaces
    ns: ['common', 'home', 'hero'],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false,
    },

    // Language codes mapping
    supportedLngs: ['en', 'zh-CN', 'zh-TW', 'ja'],
    
    // Resources (fallback for when files can't be loaded)
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
        }
      }
    }
  });

const root = createRoot(document.getElementById("root")!);
root.render(
  <App />
);
