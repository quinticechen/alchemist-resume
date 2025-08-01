
import React from 'react';
import { PlatformLogos } from '@/components/home/PlatformLogos';
import { useTranslation } from 'react-i18next';

const WebsitesSection = () => {
  const { t } = useTranslation();
  
  return (
    <section className="py-20 bg-neutral-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-primary text-transparent bg-clip-text">
          {t('Supported Job Websites')}
        </h2>
        
        <PlatformLogos />
      </div>
    </section>
  );
};

export default WebsitesSection;
