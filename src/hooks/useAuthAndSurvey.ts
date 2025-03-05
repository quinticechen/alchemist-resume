
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAuthAndSurvey = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedSurvey, setHasCompletedSurvey] = useState(false);

  useEffect(() => {
    checkAuthAndSurveyStatus();
  }, []);

  const checkAuthAndSurveyStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);

    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('has_completed_survey')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setHasCompletedSurvey(profile.has_completed_survey || false);
      }
    }
  };

  return { isAuthenticated, hasCompletedSurvey };
};
