import React from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

interface TranslationWrapperProps {
  children: React.ReactNode;
  namespace: string | string[];
  fallback?: React.ReactNode;
}

const TranslationWrapper: React.FC<TranslationWrapperProps> = ({ 
  children, 
  namespace,
  fallback = <Skeleton className="h-8 w-32" />
}) => {
  const { ready } = useTranslation(namespace);

  if (!ready) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default TranslationWrapper;