
import React from 'react';
import { cn } from '@/lib/utils';

interface HeadingProps {
  children: React.ReactNode;
  className?: string;
}

export const H1: React.FC<HeadingProps> = ({ children, className }) => (
  <h1 className={cn("text-4xl md:text-6xl font-bold tracking-tight text-neutral-900", className)}>
    {children}
  </h1>
);

export const H2: React.FC<HeadingProps> = ({ children, className }) => (
  <h2 className={cn("text-3xl md:text-4xl font-bold tracking-tight text-neutral-900", className)}>
    {children}
  </h2>
);

export const H3: React.FC<HeadingProps> = ({ children, className }) => (
  <h3 className={cn("text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900", className)}>
    {children}
  </h3>
);

export const SEOImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}> = ({ src, alt, className, width, height }) => (
  <img 
    src={src} 
    alt={alt} 
    className={className}
    width={width}
    height={height}
    loading="lazy"
  />
);
