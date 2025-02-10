
import { createRoot } from 'react-dom/client';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Initialize i18next with empty resources (they will be loaded dynamically)
i18n
  .use(initReactI18next)
  .init({
    resources: {},
    lng: localStorage.getItem('language') || navigator.language.split('-')[0] || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    ns: ['translation'],
    defaultNS: 'translation'
  });

// Get root element
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

// Create root and render app
const root = createRoot(container);
root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
