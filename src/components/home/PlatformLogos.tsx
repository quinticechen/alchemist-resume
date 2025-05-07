
import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Platform {
  id: string;
  title: string | null;
  url: string | null;
  logo_url: string | null;
}

export const PlatformLogos = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Group platforms by region based on URL patterns
  const isAsianPlatform = (url: string | null): boolean => {
    if (!url) return false;
    const asianDomains = [".tw", "jobsdb.com", "rikunabi.com"];
    return asianDomains.some(domain => url.includes(domain));
  };

  const globalPlatforms = platforms.filter(p => !isAsianPlatform(p.url));
  const asianPlatforms = platforms.filter(p => isAsianPlatform(p.url));

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("platform")
          .select("id, title, url, logo_url")
          .order("title")
          .limit(10); // Limit to top platforms

        if (error) throw error;
        setPlatforms(data || []);
      } catch (err) {
        console.error("Error fetching platforms:", err);
        setError("Failed to load job platforms");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlatforms();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-4 h-24 animate-pulse flex items-center justify-center">
            <div className="bg-gray-200 h-10 w-4/5 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        {error}
      </div>
    );
  }

  const renderPlatformLogo = (platform: Platform) => (
    <a 
      href={platform.url ? (platform.url.startsWith('http') ? platform.url : `https://${platform.url}`) : '#'} 
      target="_blank" 
      rel="noopener noreferrer"
      key={platform.id}
      className="bg-white rounded-xl shadow-sm p-4 h-24 hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-2"
    >
      {platform.logo_url ? (
        <img 
          src={platform.logo_url} 
          alt={platform.title || 'Job platform'} 
          className="h-10 object-contain mx-auto"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            // The error is on this next line - fixing by using a proper HTMLElement type check
            const nextElement = e.currentTarget.nextSibling;
            if (nextElement && nextElement instanceof HTMLElement) {
              nextElement.classList.remove('hidden');
            }
          }}
        />
      ) : null}
      <span className={platform.logo_url ? "hidden text-sm text-center" : "text-sm text-center"}>
        {platform.title || 'Untitled Platform'}
      </span>
    </a>
  );

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          Global Platforms
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {globalPlatforms.length > 0 ? 
            globalPlatforms.map(renderPlatformLogo) :
            <div className="text-gray-500 col-span-full">No global platforms available</div>
          }
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Asian Regional Platforms
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {asianPlatforms.length > 0 ? 
            asianPlatforms.map(renderPlatformLogo) :
            <div className="text-gray-500 col-span-full">No regional platforms available</div>
          }
        </div>
      </div>

      <div className="mt-8 text-center">
        <Button onClick={() => window.open('/job-websites', '_self')} className="gap-2">
          View All Job Platforms
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
