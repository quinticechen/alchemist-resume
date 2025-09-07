
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
    debug: true, // Enable debug for better visibility
    
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
        cache: 'no-cache' // Disable cache for debugging
      },
      allowMultiLoading: true,
      crossDomain: false,
      // Add request interceptor for debugging
      request: (options: any, url: string, payload: any, callback: any) => {
        console.log('i18n loading:', url);
        fetch(url)
          .then(response => {
            console.log('i18n response status:', response.status, 'for', url);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log('i18n loaded successfully:', url, data);
            callback(null, { status: 200, data });
          })
          .catch(error => {
            console.error('i18n loading failed:', url, error);
            callback(error, null);
          });
      }
    },

    // Namespaces
    ns: ['common', 'home', 'hero', 'workshop', 'job-websites', 'pricing', 'records', 'company-research'],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false,
    },

    // Language codes mapping - keep exact codes
    supportedLngs: ['en', 'zh-CN', 'zh-TW', 'ja', 'es', 'ko'],
    load: 'all',
    nonExplicitSupportedLngs: false,
    
    // Preload all supported languages for instant switching
    preload: ['en', 'zh-CN', 'zh-TW', 'ja', 'es', 'ko'],
    
    // Initialize immediately for better performance
    initImmediate: false,
    
    // Wait for all resources to load before initialization
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
    },
    
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
            termsOfService: 'Terms of Service',
            privacyPolicy: 'Privacy Policy',
            faq: 'FAQ',
            pricingPlans: 'Pricing Plans'
          }
        },
        workshop: {
          meta: {
            title: 'Alchemist Workshop - Resume Optimization',
            description: 'Transform your resume with AI-powered optimization. Upload your resume and job posting to get personalized recommendations.',
            keywords: 'resume optimization, AI resume builder, job application, career development'
          },
          title: 'Alchemist Workshop',
          resumeUpload: {
            title: 'Resume Upload',
            uploadNew: 'Upload New Resume',
            selectPrevious: 'Select Previous Resume',
            dragDrop: 'Drag and drop your PDF resume here, or click to select a file',
            maxFileSize: 'Maximum file size: 5MB',
            loading: 'Loading',
            previewResume: 'Preview Resume',
            useSelected: 'Use Selected Resume',
            remove: 'Remove',
            previousSelected: 'Previous resume selected',
            selectResume: 'Select a resume',
            uploading: 'Uploading...'
          },
          jobInfo: {
            title: 'Job Information',
            jobUrl: 'Job Posting URL',
            jobDescription: 'Job Description Text',
            urlPlaceholder: 'Paste job posting URL here. Remove all URL parameters from ?',
            descriptionPlaceholder: 'Paste the job description text here...',
            castAlchemy: 'Cast Alchemy'
          }
        },
        hero: {
          title: 'Say Goodbye to Lost Resumes - Let Ooze and Seeker Open the Door to Your Dream Job!',
          subtitle: 'Resume Alchemist is the AI-powered resume builder that helps you craft a resume that gets you hired.',
          getStarted: 'Get started',
          learnMore: 'Learn more'
        },
        // Remove embedded records - let external files handle it
        'job-websites': {
          title: 'Supported Job Websites',
          meta: {
            title: 'Supported Job Websites - Resume Alchemist',
            description: 'Browse our list of supported job websites for seamless resume optimization and application.',
            keywords: 'job websites, supported platforms, job search, resume optimization'
          }
        },
        'resume-preview': {
          meta: {
            title: 'Resume Preview - Resume Alchemist',
            description: 'Preview your optimized golden resume with AI-powered enhancements.',
            keywords: 'resume preview, golden resume, AI optimization, resume viewer'
          },
          buttons: {
            editResume: 'Edit Resume',
            changeStyle: 'Change Style',
            exportPDF: 'Export PDF',
            originalResume: 'Original Resume',
            editWithGoogleDoc: 'Edit with Google Doc'
          },
          sections: {
            personalInfo: 'Personal Information',
            professionalSummary: 'Professional Summary',
            professionalExperience: 'Professional Experience',
            education: 'Education',
            skills: 'Skills',
            projects: 'Projects',
            volunteerExperience: 'Volunteer Experience',
            certifications: 'Certifications'
          },
          styles: {
            classic: 'Classic',
            modern: 'Modern',
            minimal: 'Minimal',
            professional: 'Professional',
            creative: 'Creative'
          }
        },
        'resume-refine': {
          meta: {
            title: 'Resume Refine - Resume Alchemist',
            description: 'Refine and optimize your resume with AI-powered suggestions.',
            keywords: 'resume refine, AI suggestions, resume optimization, resume editor'
          },
          navigation: {
            back: 'Back'
          },
          jobDescription: {
            title: 'Job Description',
            fields: {
              title: 'Title',
              language: 'Language',
              keywords: 'Keywords',
              responsibilities: 'Responsibilities',
              requiredQualifications: 'Required Qualifications',
              preferredQualifications: 'Preferred Qualifications'
            }
          },
          sections: {
            personalInfo: 'Personal Information',
            professionalSummary: 'Professional Summary',
            professionalExperience: 'Professional Experience',
            education: 'Education',
            skills: 'Skills',
            projects: 'Projects',
            volunteerExperience: 'Volunteer Experience',
            certifications: 'Certifications'
          },
          aiChat: {
            greeting: 'Hey there! Your resume is glowing now, but shall we explore what else we can enhance? I\'ve got some magical tricks up my tentacles!',
            suggestions: {
              highlights: 'What are the most attractive highlights in this resume?',
              keywords: 'Which keywords could we strengthen?',
              experience: 'How can we make your experience more compelling?',
              interview: 'What questions might interviewers ask?'
            },
            placeholder: 'Ask for resume optimization suggestions...'
          },
          editor: {
            jsonEditor: 'JSON Editor',
            save: 'Save',
            finish: 'Finish'
          },
          unsavedChanges: {
            title: 'Unsaved Changes',
            description: 'You have unsaved changes. Are you sure you want to leave without saving?',
            cancel: 'Cancel',
            leave: 'Leave without saving'
          }
        },
        pricing: {
          meta: {
            title: 'Pricing Plans - Resume Alchemist',
            description: 'Choose the perfect plan for your career growth. Affordable AI-powered resume optimization with flexible pricing options.',
            keywords: 'pricing plans, resume optimization pricing, AI resume builder cost, subscription plans, career growth'
          },
          title: 'Choose Your Plan',
          subtitle: 'Select the perfect plan for your career growth',
          currentPlan: 'Current Plan',
          remainingUses: 'Remaining Uses',
          toggle: {
            monthly: 'Monthly',
            annual: 'Annual',
            saveDiscount: 'Save 25%',
            switchToAnnual: 'Switch to annual plan to save 25%'
          },
          plans: {
            apprentice: 'Apprentice',
            alchemist: 'Alchemist',
            grandmaster: 'Grandmaster',
            mostPopular: 'Most Popular',
            getCurrentPlan: 'Current Plan',
            getButton: 'Get {{plan}}'
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
            termsOfService: '服務條款',
            privacyPolicy: '隱私政策',
            faq: '常見問題',
            pricingPlans: '價格方案'
          }
        },
        workshop: {
          meta: {
            title: '煉金師工作坊 - 履歷優化',
            description: '透過 AI 驅動的優化轉化您的履歷。上傳您的履歷和職缺公告以獲得個人化建議。',
            keywords: '履歷優化, AI履歷製作器, 求職申請, 職涯發展'
          },
          title: '煉金師工作坊',
          resumeUpload: {
            title: '履歷上傳',
            uploadNew: '上傳新履歷',
            selectPrevious: '選擇先前履歷',
            dragDrop: '將您的 PDF 履歷拖放至此，或點擊選擇檔案',
            maxFileSize: '最大檔案大小：5MB',
            loading: '載入中',
            previewResume: '預覽履歷',
            useSelected: '使用選擇的履歷',
            remove: '移除',
            previousSelected: '已選擇先前履歷',
            selectResume: '選擇履歷',
            uploading: '上傳中...'
          },
          jobInfo: {
            title: '職缺資訊',
            jobUrl: '職缺公告 URL',
            jobDescription: '職缺描述文字',
            urlPlaceholder: '在此貼上職缺公告 URL。請移除 ? 後的所有 URL 參數',
            descriptionPlaceholder: '在此貼上職缺描述文字...',
            castAlchemy: '施展煉金術'
          }
        },
        hero: {
          title: '告別迷失的履歷 - 讓軟泥怪和探索者為您打開理想工作的大門！',
          subtitle: '履歷煉金術師是AI驅動的履歷構建器，幫助您製作能讓您被錄用的履歷。',
          getStarted: '開始使用',
          learnMore: '了解更多'
        },
        records: {
          title: '煉金記錄',
          usageStats: {
            title: '使用統計',
            totalGoldenResumes: '生成的黃金履歷總數',
            unlimitedUses: '無限制使用'
          },
          sorting: {
            resumeGenerationLatest: '履歷生成時間（最新到最早）',
            resumeGenerationEarliest: '履歷生成時間（最早到最新）',
            lastEditLatest: '最後編輯時間（最新到最早）',
            lastEditEarliest: '最後編輯時間（最早到最新）',
            statusAscending: '申請狀態（升序）',
            statusDescending: '申請狀態（降序）'
          },
          filters: {
            allStatuses: '所有狀態',
            activeFilters: '啟用的篩選器',
            filtersSelected: '已選擇篩選器'
          },
          status: {
            resume: '履歷',
            coverLetter: '求職信',
            applicationSubmitted: '已提交申請',
            followingUp: '跟進中',
            interview: '面試',
            rejected: '已拒絕',
            accepted: '已接受'
          },
          actions: {
            viewGoldenResume: '查看黃金履歷',
            createCoverLetter: '建立求職信',
            linkJD: '連結職缺',
            applyJob: '申請職位'
          }
        },
        'job-websites': {
          title: '支援的求職網站',
          meta: {
            title: '支援的求職網站 - 履歷煉金師',
            description: '瀏覽我們支援的求職網站清單，實現無縫履歷優化和申請。',
            keywords: '求職網站, 支援平台, 求職, 履歷優化'
          }
        },
        'resume-preview': {
          meta: {
            title: '履歷預覽 - 履歷煉金師',
            description: '預覽您經過AI優化的黃金履歷。',
            keywords: '履歷預覽, 黃金履歷, AI優化, 履歷檢視器'
          },
          buttons: {
            editResume: '編輯履歷',
            changeStyle: '更改樣式',
            exportPDF: '匯出PDF',
            originalResume: '原始履歷',
            editWithGoogleDoc: '使用Google文件編輯'
          },
          sections: {
            personalInfo: '個人資訊',
            professionalSummary: '專業摘要',
            professionalExperience: '專業經歷',
            education: '教育背景',
            skills: '技能',
            projects: '專案',
            volunteerExperience: '志工經驗',
            certifications: '證書'
          },
          styles: {
            classic: '經典',
            modern: '現代',
            minimal: '簡約',
            professional: '專業',
            creative: '創意'
          }
        },
        'resume-refine': {
          meta: {
            title: '履歷精煉 - 履歷煉金師',
            description: '使用AI建議精煉和優化您的履歷。',
            keywords: '履歷精煉, AI建議, 履歷優化, 履歷編輯器'
          },
          navigation: {
            back: '返回'
          },
          jobDescription: {
            title: '職位描述',
            fields: {
              title: '職稱',
              language: '語言',
              keywords: '關鍵字',
              responsibilities: '職責',
              requiredQualifications: '必要資格',
              preferredQualifications: '優先資格'
            }
          },
          sections: {
            personalInfo: '個人資訊',
            professionalSummary: '專業摘要',
            professionalExperience: '專業經歷',
            education: '教育背景',
            skills: '技能',
            projects: '專案',
            volunteerExperience: '志工經驗',
            certifications: '證書'
          },
          aiChat: {
            greeting: '嗨！您的履歷現在已經很棒了，但我們要不要探索一下還能增強什麼呢？我有一些神奇的技巧可以分享！',
            suggestions: {
              highlights: '這份履歷中最吸引人的亮點是什麼？',
              keywords: '我們可以加強哪些關鍵字？',
              experience: '如何讓您的經歷更有說服力？',
              interview: '面試官可能會問什麼問題？'
            },
            placeholder: '詢問履歷優化建議...'
          },
          editor: {
            jsonEditor: 'JSON編輯器',
            save: '儲存',
            finish: '完成'
          },
          unsavedChanges: {
            title: '未儲存的變更',
            description: '您有未儲存的變更。確定要在未儲存的情況下離開嗎？',
            cancel: '取消',
            leave: '不儲存離開'
          }
        },
        pricing: {
          meta: {
            title: '價格方案 - 履歷煉金師',
            description: '為您的職業成長選擇完美的方案。價格實惠的AI驅動履歷優化，靈活的價格選擇。',
            keywords: '價格方案, 履歷優化價格, AI履歷生成器費用, 訂閱方案, 職業成長'
          },
          title: '選擇您的方案',
          subtitle: '為您的職業成長選擇完美的方案',
          currentPlan: '目前方案',
          remainingUses: '剩餘使用次數',
          toggle: {
            monthly: '月付',
            annual: '年付',
            saveDiscount: '節省 25%',
            switchToAnnual: '切換至年付方案可節省 25%'
          },
          plans: {
            apprentice: '學徒',
            alchemist: '煉金師',
            grandmaster: '大師',
            mostPopular: '最受歡迎',
            getCurrentPlan: '目前方案',
            getButton: '選擇 {{plan}}'
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
      },
      es: {
        common: {
          "loading": "Cargando...",
          "error": "Error",
          "success": "Éxito",
          "cancel": "Cancelar",
          "save": "Guardar",
          "delete": "Eliminar",
          "edit": "Editar",
          "close": "Cerrar",
          "back": "Atrás",
          "next": "Siguiente",
          "previous": "Anterior",
          "submit": "Enviar",
          "login": "Iniciar Sesión",
          "logout": "Cerrar Sesión",
          "signup": "Registrarse",
          "email": "Correo Electrónico",
          "password": "Contraseña",
          "name": "Nombre",
          "welcome": "Bienvenido"
        },
        home: {
          "hero": {
            "title": "¡Dile Adiós a los Currículums Perdidos - ¡Deja que Ooze y Seeker Abran la Puerta a Tu Trabajo Soñado!",
            "subtitle": "Resume Alchemist es el generador de currículums impulsado por IA que te ayuda a crear un currículum que te consiga trabajo.",
            "getStarted": "Comenzar",
            "learnMore": "Saber más"
          },
          "cta": {
            "title": "¡Obtén 5 Usos Gratuitos Ahora!",
            "subtitle": "Únete a miles de candidatos exitosos que han transformado sus carreras con Resume Alchemist.",
            "button": "Comenzar Gratis"
          },
          "features": {
            "title": "La Nueva Forma de Construir Currículums",
            "subtitle": "Entendemos los desafíos de crear un currículum que destaque. Por eso construimos Resume Alchemist, el generador de currículums impulsado por IA que te ayuda a crear un currículum que te consiga trabajo.",
            "items": {
              "aiPowered": {
                "title": "Impulsado por IA",
                "description": "Nuestra IA analiza tu experiencia y habilidades para crear un currículum que destaque tus fortalezas."
              },
              "atsOptimized": {
                "title": "Optimizado para ATS",
                "description": "Nos aseguramos de que tu currículum esté optimizado para sistemas de seguimiento de candidatos (ATS) para aumentar tus posibilidades de conseguir una entrevista."
              },
              "jobSpecific": {
                "title": "Específico para el Trabajo",
                "description": "Adaptamos tu currículum a ofertas de trabajo específicas, destacando las habilidades y experiencia que coinciden con la descripción del trabajo."
              },
              "easyToUse": {
                "title": "Fácil de Usar",
                "description": "Nuestra interfaz intuitiva hace que sea fácil crear un currículum profesional en minutos."
              }
            }
          },
          "howItWorks": {
            "title": "Cómo funciona",
            "subtitle": "Tres simples pasos para crear un currículum que te consiga trabajo.",
            "steps": {
              "upload": {
                "title": "Sube Tu Currículum",
                "description": "Sube tu currículum existente en formato PDF."
              },
              "enterJob": {
                "title": "Ingresa la URL de la Oferta de Trabajo",
                "description": "Pega la URL de la oferta de trabajo a la que estás aplicando."
              },
              "getOptimized": {
                "title": "Obtén Tu Currículum Optimizado",
                "description": "Nuestra IA analizará tu currículum y la oferta de trabajo para crear un currículum personalizado que destaque tus habilidades y experiencia."
              }
            }
          },
          "companies": {
            "title": "Optimiza Tu Currículum para las Mejores Empresas"
          },
          "testimonials": {
            "title": "Lo que dice la gente",
            "subtitle": "No solo confíes en nuestra palabra. Mira lo que otros dicen sobre Resume Alchemist.",
            "items": [
              {
                "quote": "Resume Alchemist me ayudó a conseguir el trabajo de mis sueños. El generador de currículums impulsado por IA hizo que fuera fácil crear un currículum que destacara mis habilidades y experiencia.",
                "name": "María García",
                "title": "Ingeniera de Software"
              },
              {
                "quote": "Estaba luchando por crear un currículum que destacara. Resume Alchemist hizo que fuera fácil crear un currículum profesional que destacara mis habilidades y experiencia.",
                "name": "Carlos Rodríguez",
                "title": "Gerente de Marketing"
              },
              {
                "quote": "Era escéptica sobre usar un generador de currículums impulsado por IA, pero Resume Alchemist superó mis expectativas. Hizo que fuera fácil crear un currículum que destacara mis habilidades y experiencia.",
                "name": "Ana López",
                "title": "Gerente de Producto"
              }
            ]
          },
          "footer": {
            "company": "ResumeAlchemist",
            "copyright": "2025 ResumeAlchemist",
            "quickLinks": "Enlaces Rápidos",
            "contact": "Contáctanos",
            "followUs": "Síguenos",
            "links": {
              "terms": "Términos de Servicio",
              "privacy": "Política de Privacidad",
              "faq": "Preguntas Frecuentes",
              "pricing": "Planes de Precios"
            }
          }
        },
        hero: {
          "title": "¡Dile Adiós a los Currículums Perdidos - ¡Deja que Ooze y Seeker Abran la Puerta a Tu Trabajo Soñado!",
          "subtitle": "Resume Alchemist es el generador de currículums impulsado por IA que te ayuda a crear un currículum que te consiga trabajo.",
          "getStarted": "Comenzar",
          "learnMore": "Saber más"
        }
      },
      ko: {
        common: {
          "loading": "로딩 중...",
          "error": "오류",
          "success": "성공",
          "cancel": "취소",
          "save": "저장",
          "delete": "삭제",
          "edit": "편집",
          "close": "닫기",
          "back": "뒤로",
          "next": "다음",
          "previous": "이전",
          "submit": "제출",
          "login": "로그인",
          "logout": "로그아웃",
          "signup": "회원가입",
          "email": "이메일",
          "password": "비밀번호",
          "name": "이름",
          "welcome": "환영합니다"
        },
        home: {
          "hero": {
            "title": "잃어버린 이력서에 작별을 고하세요 - Ooze와 Seeker가 꿈의 직장으로 가는 문을 열어드립니다!",
            "subtitle": "Resume Alchemist는 채용되는 이력서를 만들어주는 AI 기반 이력서 빌더입니다.",
            "getStarted": "시작하기",
            "learnMore": "더 알아보기"
          },
          "cta": {
            "title": "지금 5번의 무료 사용 기회를 받으세요!",
            "subtitle": "Resume Alchemist로 커리어를 변화시킨 수천 명의 성공적인 지원자들과 함께하세요.",
            "button": "무료로 시작하기"
          },
          "features": {
            "title": "이력서를 만드는 새로운 방법",
            "subtitle": "돋보이는 이력서를 만드는 것의 어려움을 이해합니다. 그래서 채용되는 이력서를 만들어주는 AI 기반 이력서 빌더인 Resume Alchemist를 만들었습니다.",
            "items": {
              "aiPowered": {
                "title": "AI 기반",
                "description": "우리의 AI가 당신의 경험과 기술을 분석하여 강점을 부각시키는 이력서를 작성합니다."
              },
              "atsOptimized": {
                "title": "ATS 최적화",
                "description": "지원자 추적 시스템(ATS)에 최적화된 이력서로 면접 기회를 늘려드립니다."
              },
              "jobSpecific": {
                "title": "맞춤형 작업",
                "description": "특정 채용 공고에 맞춰 이력서를 조정하여 직무 설명과 일치하는 기술과 경험을 강조합니다."
              },
              "easyToUse": {
                "title": "사용하기 쉬움",
                "description": "직관적인 인터페이스로 몇 분 안에 전문적인 이력서를 쉽게 만들 수 있습니다."
              }
            }
          },
          "howItWorks": {
            "title": "작동 방식",
            "subtitle": "채용되는 이력서를 만드는 세 가지 간단한 단계.",
            "steps": {
              "upload": {
                "title": "이력서 업로드",
                "description": "기존 이력서를 PDF 형식으로 업로드하세요."
              },
              "enterJob": {
                "title": "채용 공고 URL 입력",
                "description": "지원하려는 채용 공고의 URL을 붙여넣으세요."
              },
              "getOptimized": {
                "title": "최적화된 이력서 받기",
                "description": "우리의 AI가 이력서와 채용 공고를 분석하여 기술과 경험을 강조하는 맞춤형 이력서를 만들어드립니다."
              }
            }
          },
          "companies": {
            "title": "최고의 기업을 위한 이력서 최적화"
          },
          "testimonials": {
            "title": "사람들의 말",
            "subtitle": "우리 말만 믿지 마세요. Resume Alchemist에 대한 다른 사람들의 의견을 확인해보세요.",
            "items": [
              {
                "quote": "Resume Alchemist가 제가 꿈의 직장을 얻는 데 도움이 되었습니다. AI 기반 이력서 빌더로 제 기술과 경험을 강조하는 이력서를 쉽게 만들 수 있었습니다.",
                "name": "김지은",
                "title": "소프트웨어 엔지니어"
              },
              {
                "quote": "돋보이는 이력서를 만드는 데 어려움을 겪고 있었습니다. Resume Alchemist로 제 기술과 경험을 강조하는 전문적인 이력서를 쉽게 만들 수 있었습니다.",
                "name": "박민수",
                "title": "마케팅 매니저"
              },
              {
                "quote": "AI 기반 이력서 빌더 사용에 대해 회의적이었지만, Resume Alchemist는 제 기대를 뛰어넘었습니다. 제 기술과 경험을 강조하는 이력서를 쉽게 만들 수 있었습니다.",
                "name": "이수정",
                "title": "제품 매니저"
              }
            ]
          },
          "footer": {
            "company": "ResumeAlchemist",
            "copyright": "2025 ResumeAlchemist",
            "quickLinks": "빠른 링크",
            "contact": "문의하기",
            "followUs": "팔로우하기",
            "links": {
              "terms": "서비스 약관",
              "privacy": "개인정보처리방침",
              "faq": "자주 묻는 질문",
              "pricing": "요금제"
            }
          }
        },
        hero: {
          "title": "잃어버린 이력서에 작별을 고하세요 - Ooze와 Seeker가 꿈의 직장으로 가는 문을 열어드립니다!",
          "subtitle": "Resume Alchemist는 채용되는 이력서를 만들어주는 AI 기반 이력서 빌더입니다.",
          "getStarted": "시작하기",
          "learnMore": "더 알아보기"
        }
      }
    }
  });

// Initialize the React app after i18n is configured
i18n.on('initialized', () => {
  console.log('i18n initialized successfully');
  console.log('Available namespaces:', i18n.options.ns);
  console.log('Loaded resources:', Object.keys(i18n.services.resourceStore.data));
});

i18n.on('failedLoading', (lng, ns, msg) => {
  console.error('Failed to load namespace:', ns, 'for language:', lng, msg);
});

i18n.on('loaded', (loaded) => {
  console.log('i18n resources loaded:', loaded);
});

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
