
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
        cache: 'force-cache'
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
            subtitle: 'Turn your ordinary resume into the perfect match for your dream job using our AI-powered optimization technology.',
            learnMore: 'Learn More',
            startFreeTrial: 'Start Free Trial',
            goToWorkshop: 'Go to Workshop'
          },
          cta: {
            title: 'Start with 3 Free Uses',
            subtitle: 'Try our AI-powered resume optimization with no commitment.'
          },
          faq: {
            title: 'Frequently Asked Questions',
            more: 'More',
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
        },
        hero: {
          title: 'Say Goodbye to Lost Resumes - Let Ooze and Seeker Open the Door to Your Dream Job!',
          subtitle: 'Resume Alchemist is the AI-powered resume builder that helps you craft a resume that gets you hired.',
          getStarted: 'Get started',
          learnMore: 'Learn more'
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
        },
        home: {
          hero: {
            title: '用AI炼金术改造您的简历',
            subtitle: '使用我们的AI驱动优化技术，将您的普通简历转变为理想工作的完美匹配。',
            learnMore: '了解更多',
            startFreeTrial: '开始免费试用',
            goToWorkshop: '前往工作坊'
          },
          cta: {
            title: '从3次免费使用开始',
            subtitle: '无需承诺，尝试我们的AI驱动简历优化。'
          },
          faq: {
            title: '常见问题',
            more: '更多',
            questions: [
              {
                question: '我可以获得多少次免费使用？',
                answer: '新用户可获得3次免费使用来试用我们的服务。'
              },
              {
                question: '支持哪些文件格式？',
                answer: '目前，我们支持PDF格式的简历上传。'
              },
              {
                question: '处理过程需要多长时间？',
                answer: '优化过程通常需要2-3分钟。'
              }
            ]
          }
        },
        hero: {
          title: '告别迷失的简历 - 让软泥怪和探索者为您打开理想工作的大门！',
          subtitle: '简历炼金术师是AI驱动的简历构建器，帮助您制作能让您被录用的简历。',
          getStarted: '开始使用',
          learnMore: '了解更多'
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
        },
        home: {
          hero: {
            title: '用AI煉金術改造您的履歷',
            subtitle: '使用我們的AI驅動優化技術，將您的普通履歷轉變為理想工作的完美匹配。',
            learnMore: '了解更多',
            startFreeTrial: '開始免費試用',
            goToWorkshop: '前往工作坊'
          },
          cta: {
            title: '從3次免費使用開始',
            subtitle: '無需承諾，嘗試我們的AI驅動履歷優化。'
          },
          faq: {
            title: '常見問題',
            more: '更多',
            questions: [
              {
                question: '我可以獲得多少次免費使用？',
                answer: '新用戶可獲得3次免費使用來試用我們的服務。'
              },
              {
                question: '支援哪些檔案格式？',
                answer: '目前，我們支援PDF格式的履歷上傳。'
              },
              {
                question: '處理過程需要多長時間？',
                answer: '優化過程通常需要2-3分鐘。'
              }
            ]
          }
        },
        hero: {
          title: '告別迷失的履歷 - 讓軟泥怪和探索者為您打開理想工作的大門！',
          subtitle: '履歷煉金術師是AI驅動的履歷構建器，幫助您製作能讓您被錄用的履歷。',
          getStarted: '開始使用',
          learnMore: '了解更多'
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
        },
        home: {
          hero: {
            title: 'AIアルケミーで履歴書を変革',
            subtitle: 'AIを活用した最適化技術を使用して、普通の履歴書を理想の仕事に完璧にマッチするものに変換します。',
            learnMore: '詳細を見る',
            startFreeTrial: '無料トライアル開始',
            goToWorkshop: 'ワークショップへ'
          },
          cta: {
            title: '3回の無料使用から始める',
            subtitle: 'コミットなしで、AIを活用した履歴書最適化をお試しください。'
          },
          faq: {
            title: 'よくある質問',
            more: 'さらに表示',
            questions: [
              {
                question: '無料使用は何回までですか？',
                answer: '新規ユーザーは3回の無料使用でサービスをお試しいただけます。'
              },
              {
                question: '対応しているファイル形式は？',
                answer: '現在、履歴書のアップロードはPDF形式に対応しています。'
              },
              {
                question: '処理にはどのくらい時間がかかりますか？',
                answer: '最適化プロセスは通常2-3分かかります。'
              }
            ]
          }
        },
        hero: {
          title: '失われた履歴書にさよならを - オーズとシーカーにあなたの夢の仕事への扉を開いてもらいましょう！',
          subtitle: '履歴書アルケミストは、採用される履歴書の作成をお手伝いするAI搭載の履歴書ビルダーです。',
          getStarted: '開始する',
          learnMore: '詳細を見る'
        }
      }
    }
  });

const root = createRoot(document.getElementById("root")!);
root.render(
  <App />
);
