
import React from 'react';
import { useTranslation } from 'react-i18next';

const companies = [
  {
    name: 'Google',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    jobsUrl: 'https://careers.google.com/jobs/',
  },
  {
    name: 'Amazon',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    jobsUrl: 'https://www.amazon.jobs/',
  },
  {
    name: 'Microsoft',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg',
    jobsUrl: 'https://careers.microsoft.com/',
  },
  {
    name: 'Apple',
    logo: 'https://www.svgrepo.com/show/303665/apple-11-logo.svg',
    jobsUrl: 'https://jobs.apple.com/',
  },
  {
    name: 'Meta',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg',
    jobsUrl: 'https://www.metacareers.com/jobs/',
  },
];

export const TopCompanies = () => {
  const { t } = useTranslation('home');
  
  const handleCompanyClick = (jobsUrl: string, companyName: string) => {
    window.open(jobsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="py-16 bg-neutral-50">
      <div className="max-w-6xl mt-32 mb-32 mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-primary text-transparent bg-clip-text">
          {t('companies.title', { defaultValue: 'Optimize Your Resume for Top Companies' })}
        </h2>
        <div className="flex flex-wrap justify-center gap-8 items-center">
          {companies.map((company) => (
            <button
              key={company.name}
              onClick={() => handleCompanyClick(company.jobsUrl, company.name)}
              className="group flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-white hover:shadow-lg transition-all duration-200 hero-element"
              aria-label={`View ${company.name} job opportunities`}
            >
              <div className="w-20 h-20 flex items-center justify-center">
                <img
                  src={company.logo}
                  alt={`${company.name} logo`}
                  className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-200"
                />
              </div>
              <span className="text-sm font-medium text-neutral-700 group-hover:text-primary transition-colors">
                {company.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
