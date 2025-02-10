
import { createRoot } from 'react-dom/client';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import App from './App.tsx';
import './index.css';

// Initialize i18next with empty resources (they will be loaded dynamically)
i18n
  .use(initReactI18next)
  .init({
    resources: {},
    lng: localStorage.getItem('language') || navigator.language.split('-')[0] || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

createRoot(document.getElementById('root')!).render(<App />);
