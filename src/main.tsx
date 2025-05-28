
import React from 'react';
import { createRoot } from 'react-dom/client';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import App from './App.tsx';
import './index.css';

// English translations
const enTranslations = {
  common: {
    workshop: 'Workshop',
    records: 'Records',
    pricing: 'Pricing',
    faq: 'FAQ',
    signOut: 'Sign Out',
    usesLeft: '{{count}} uses left',
    startFreeTrial: 'Start Free Trial',
    signIn: 'Sign In',
    supportedWebsites: 'Supported Websites'
  }
};

// Traditional Chinese translations
const zhTranslations = {
  common: {
    workshop: '工作坊',
    records: '記錄',
    pricing: '價格',
    faq: '常見問題',
    signOut: '登出',
    usesLeft: '剩餘 {{count}} 次使用',
    startFreeTrial: '開始免費試用',
    signIn: '登入',
    supportedWebsites: '支援的網站'
  }
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: enTranslations,
      zh: zhTranslations
    },
    lng: localStorage.getItem('language') || 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

const root = createRoot(document.getElementById("root")!);
root.render(
  <App />
);
