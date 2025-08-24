
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { generateHreflangUrls } from '@/utils/languageRouting';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  hreflang?: Array<{ lang: string; url: string }>;
  noIndex?: boolean;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage = "https://resumealchemist.qwizai.com/og-image.png",
  ogType = "website",
  hreflang,
  noIndex = false
}) => {
  const location = useLocation();
  const fullTitle = title.includes('Resume Alchemist') ? title : `${title} | Resume Alchemist`;
  
  // Auto-generate canonical URL and hreflang if not provided
  const finalCanonicalUrl = canonicalUrl || `https://resumealchemist.qwizai.com${location.pathname}`;
  const finalHreflang = hreflang || generateHreflangUrls(location.pathname);
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={finalCanonicalUrl} />
      
      {/* Robots Meta */}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Hreflang Tags */}
      {finalHreflang.map(({ lang, url }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={finalCanonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Resume Alchemist" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="author" content="Resume Alchemist" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />
    </Helmet>
  );
};
