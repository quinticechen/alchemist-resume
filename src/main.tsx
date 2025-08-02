
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
          },
          features: {
            title: 'The new way to build resumes',
            subtitle: 'We understand the challenges of creating a resume that stands out. That\'s why we built Resume Alchemist, the AI-powered resume builder that helps you craft a resume that gets you hired.',
            items: {
              aiPowered: {
                title: 'AI-Powered',
                description: 'Our AI analyzes your experience and skills to craft a resume that highlights your strengths.'
              },
              atsOptimized: {
                title: 'ATS Optimized',
                description: 'We ensure your resume is optimized for applicant tracking systems (ATS) to increase your chances of getting an interview.'
              },
              jobSpecific: {
                title: 'Job-Specific',
                description: 'We tailor your resume to specific job postings, highlighting the skills and experience that match the job description.'
              },
              easyToUse: {
                title: 'Easy to Use',
                description: 'Our intuitive interface makes it easy to create a professional resume in minutes.'
              }
            }
          },
          howItWorks: {
            title: 'How it works',
            subtitle: 'Three simple steps to create a resume that gets you hired.',
            steps: {
              upload: {
                title: 'Upload Your Resume',
                description: 'Upload your existing resume in PDF format.'
              },
              enterJob: {
                title: 'Enter Job Posting URL',
                description: 'Paste the URL of the job posting you\'re applying for.'
              },
              getOptimized: {
                title: 'Get Your Optimized Resume',
                description: 'Our AI will analyze your resume and the job posting to create a tailored resume that highlights your skills and experience.'
              }
            }
          },
          companies: {
            title: 'Optimize Your Resume for Top Companies'
          },
          testimonials: {
            title: 'What people are saying',
            subtitle: 'Don\'t just take our word for it. See what others are saying about Resume Alchemist.',
            items: [
              {
                quote: '"Resume Alchemist helped me land my dream job. The AI-powered resume builder made it easy to create a resume that highlighted my skills and experience."',
                name: 'Jane Doe',
                title: 'Software Engineer'
              },
              {
                quote: '"I was struggling to create a resume that stood out. Resume Alchemist made it easy to create a professional resume that highlighted my skills and experience."',
                name: 'John Smith',
                title: 'Marketing Manager'
              },
              {
                quote: '"I was skeptical about using an AI-powered resume builder, but Resume Alchemist exceeded my expectations. The AI-powered resume builder made it easy to create a resume that highlighted my skills and experience."',
                name: 'Emily Johnson',
                title: 'Product Manager'
              }
            ]
          },
          footer: {
            company: 'ResumeAlchemist',
            quickLinks: 'Quick Links',
            contact: 'Contact Us',
            followUs: 'Follow Us',
            links: {
              terms: 'Terms of Service',
              privacy: 'Privacy Policy',
              faq: 'FAQ',
              pricing: 'Pricing Plans'
            }
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
          },
          features: {
            title: '构建简历的新方式',
            subtitle: '我们理解创建出色简历的挑战。这就是为什么我们构建了简历炼金术师，这个AI驱动的简历构建器帮助您制作能让您被录用的简历。',
            items: {
              aiPowered: {
                title: 'AI驱动',
                description: '我们的AI分析您的经验和技能，制作突出您优势的简历。'
              },
              atsOptimized: {
                title: 'ATS优化',
                description: '我们确保您的简历针对申请人跟踪系统(ATS)进行优化，提高您获得面试的机会。'
              },
              jobSpecific: {
                title: '职位特定',
                description: '我们根据特定职位发布定制您的简历，突出与职位描述匹配的技能和经验。'
              },
              easyToUse: {
                title: '易于使用',
                description: '我们直观的界面让您在几分钟内轻松创建专业简历。'
              }
            }
          },
          howItWorks: {
            title: '工作原理',
            subtitle: '三个简单步骤创建让您被录用的简历。',
            steps: {
              upload: {
                title: '上传您的简历',
                description: '以PDF格式上传您现有的简历。'
              },
              enterJob: {
                title: '输入职位发布URL',
                description: '粘贴您申请职位的URL。'
              },
              getOptimized: {
                title: '获取优化简历',
                description: '我们的AI将分析您的简历和职位发布，创建突出您技能和经验的定制简历。'
              }
            }
          },
          companies: {
            title: '为顶级公司优化您的简历'
          },
          testimonials: {
            title: '用户评价',
            subtitle: '不要只听我们的话，看看其他人对简历炼金术师的评价。',
            items: [
              {
                quote: '"简历炼金术师帮助我找到了理想工作。AI驱动的简历构建器让我轻松创建了突出我技能和经验的简历。"',
                name: '张小华',
                title: '软件工程师'
              },
              {
                quote: '"我一直在努力创建一份出色的简历。简历炼金术师让我轻松创建了突出我技能和经验的专业简历。"',
                name: '李明',
                title: '市场经理'
              },
              {
                quote: '"我对使用AI驱动的简历构建器持怀疑态度，但简历炼金术师超出了我的期望。AI驱动的简历构建器让我轻松创建了突出我技能和经验的简历。"',
                name: '王丽',
                title: '产品经理'
              }
            ]
          },
          footer: {
            company: '简历炼金术师',
            quickLinks: '快速链接',
            contact: '联系我们',
            followUs: '关注我们',
            links: {
              terms: '服务条款',
              privacy: '隐私政策',
              faq: '常见问题',
              pricing: '价格方案'
            }
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
          },
          features: {
            title: '構建履歷的新方式',
            subtitle: '我們理解創建出色履歷的挑戰。這就是為什麼我們構建了履歷煉金術師，這個AI驅動的履歷構建器幫助您製作能讓您被錄用的履歷。',
            items: {
              aiPowered: {
                title: 'AI驅動',
                description: '我們的AI分析您的經驗和技能，製作突出您優勢的履歷。'
              },
              atsOptimized: {
                title: 'ATS優化',
                description: '我們確保您的履歷針對申請人追蹤系統(ATS)進行優化，提高您獲得面試的機會。'
              },
              jobSpecific: {
                title: '職位特定',
                description: '我們根據特定職位發佈定製您的履歷，突出與職位描述匹配的技能和經驗。'
              },
              easyToUse: {
                title: '易於使用',
                description: '我們直觀的界面讓您在幾分鐘內輕鬆創建專業履歷。'
              }
            }
          },
          howItWorks: {
            title: '工作原理',
            subtitle: '三個簡單步驟創建讓您被錄用的履歷。',
            steps: {
              upload: {
                title: '上傳您的履歷',
                description: '以PDF格式上傳您現有的履歷。'
              },
              enterJob: {
                title: '輸入職位發佈URL',
                description: '貼上您申請職位的URL。'
              },
              getOptimized: {
                title: '獲取優化履歷',
                description: '我們的AI將分析您的履歷和職位發佈，創建突出您技能和經驗的定製履歷。'
              }
            }
          },
          companies: {
            title: '為頂級公司優化您的履歷'
          },
          testimonials: {
            title: '用戶評價',
            subtitle: '不要只聽我們的話，看看其他人對履歷煉金術師的評價。',
            items: [
              {
                quote: '"履歷煉金術師幫助我找到了理想工作。AI驅動的履歷構建器讓我輕鬆創建了突出我技能和經驗的履歷。"',
                name: '張小華',
                title: '軟體工程師'
              },
              {
                quote: '"我一直在努力創建一份出色的履歷。履歷煉金術師讓我輕鬆創建了突出我技能和經驗的專業履歷。"',
                name: '李明',
                title: '行銷經理'
              },
              {
                quote: '"我對使用AI驅動的履歷構建器持懷疑態度，但履歷煉金術師超出了我的期望。AI驅動的履歷構建器讓我輕鬆創建了突出我技能和經驗的履歷。"',
                name: '王麗',
                title: '產品經理'
              }
            ]
          },
          footer: {
            company: '履歷煉金術師',
            quickLinks: '快速連結',
            contact: '聯繫我們',
            followUs: '關注我們',
            links: {
              terms: '服務條款',
              privacy: '隱私政策',
              faq: '常見問題',
              pricing: '價格方案'
            }
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
          },
          features: {
            title: '履歴書作成の新しい方法',
            subtitle: '目立つ履歴書を作成する課題を理解しています。そのため、採用される履歴書の作成をお手伝いするAI搭載の履歴書ビルダー、履歴書アルケミストを構築しました。',
            items: {
              aiPowered: {
                title: 'AI搭載',
                description: 'AIがあなたの経験とスキルを分析し、強みを際立たせる履歴書を作成します。'
              },
              atsOptimized: {
                title: 'ATS最適化',
                description: '応募者追跡システム（ATS）に最適化された履歴書で、面接の機会を増やします。'
              },
              jobSpecific: {
                title: '求人特化',
                description: '特定の求人に合わせて履歴書をカスタマイズし、求人内容に一致するスキルと経験を強調します。'
              },
              easyToUse: {
                title: '使いやすい',
                description: '直感的なインターフェースで、数分でプロフェッショナルな履歴書を簡単に作成できます。'
              }
            }
          },
          howItWorks: {
            title: '使い方',
            subtitle: '採用される履歴書を作成する3つの簡単なステップ。',
            steps: {
              upload: {
                title: '履歴書をアップロード',
                description: '既存の履歴書をPDF形式でアップロードしてください。'
              },
              enterJob: {
                title: '求人URLを入力',
                description: '応募する求人のURLを貼り付けてください。'
              },
              getOptimized: {
                title: '最適化された履歴書を取得',
                description: 'AIがあなたの履歴書と求人を分析し、スキルと経験を強調したカスタマイズ履歴書を作成します。'
              }
            }
          },
          companies: {
            title: 'トップ企業向けに履歴書を最適化'
          },
          testimonials: {
            title: '利用者の声',
            subtitle: '私たちの言葉だけでなく、履歴書アルケミストについて他の方々の意見をご覧ください。',
            items: [
              {
                quote: '「履歴書アルケミストのおかげで理想の仕事に就けました。AI搭載の履歴書ビルダーで、スキルと経験を強調した履歴書を簡単に作成できました。」',
                name: '田中花子',
                title: 'ソフトウェアエンジニア'
              },
              {
                quote: '「目立つ履歴書を作成するのに苦労していました。履歴書アルケミストで、スキルと経験を強調したプロフェッショナルな履歴書を簡単に作成できました。」',
                name: '佐藤太郎',
                title: 'マーケティングマネージャー'
              },
              {
                quote: '「AI搭載の履歴書ビルダーの使用に懐疑的でしたが、履歴書アルケミストは期待を上回りました。AI搭載の履歴書ビルダーで、スキルと経験を強調した履歴書を簡単に作成できました。」',
                name: '鈴木恵美',
                title: 'プロダクトマネージャー'
              }
            ]
          },
          footer: {
            company: '履歴書アルケミスト',
            quickLinks: 'クイックリンク',
            contact: 'お問い合わせ',
            followUs: 'フォローする',
            links: {
              terms: '利用規約',
              privacy: 'プライバシーポリシー',
              faq: 'よくある質問',
              pricing: '料金プラン'
            }
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
