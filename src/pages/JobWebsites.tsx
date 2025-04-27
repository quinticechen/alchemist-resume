
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PlatformCard } from "@/components/platform/PlatformCard";

interface Platform {
  id: string;
  url: string;
  attrs: any;
}

const JobWebsites = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const { data, error } = await supabase
          .from('Platform')
          .select('*')
          .order('created_time', { ascending: false });

        if (error) throw error;
        setPlatforms(data || []);
      } catch (error) {
        console.error('Error fetching platforms:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlatforms();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-gray-200 rounded-lg"/>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Job Websites</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => (
          <PlatformCard
            key={platform.id}
            name={platform.attrs?.title || 'Untitled'}
            url={platform.url || '#'}
            attrs={platform.attrs}
          />
        ))}
      </div>
    </div>
  );
};

export default JobWebsites;
