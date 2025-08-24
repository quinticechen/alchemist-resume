
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('userProfile');
      sessionStorage.removeItem('userAuthenticated');
      sessionStorage.removeItem('hasVisitedWorkshop');
      sessionStorage.removeItem('welcomeToastShown');
      localStorage.removeItem('currentAnalysisId');
      localStorage.removeItem('redirectAfterLogin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    setIsLoading(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        
        if (event === 'SIGNED_IN') {
          console.log('Auth: User signed in, processing redirect');
          // Use setTimeout to avoid conflicts with LanguageRouter
          setTimeout(() => {
            const redirectPath = localStorage.getItem('redirectAfterLogin');
            if (redirectPath) {
              localStorage.removeItem('redirectAfterLogin');
              navigate(redirectPath);
            } else {
              const isFirstSignIn = !localStorage.getItem('hasSignedInBefore');
              
              if (isFirstSignIn && newSession) {
                localStorage.setItem('hasSignedInBefore', 'true');
                navigate('/en/user-onboard');
              } else {
                // Navigate to alchemist-workshop with language prefix
                navigate('/en/alchemist-workshop');
              }
            }
          }, 100);
        }
      }
    );

    // Check for existing session on page load
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setIsLoading(false);
      
      // If there's a session and a stored redirect path, navigate there
      if (initialSession) {
        const redirectPath = localStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
          localStorage.removeItem('redirectAfterLogin');
          navigate(redirectPath);
        }
      }
    });

    // Set session flag to maintain state across tabs
    window.addEventListener('focus', async () => {
      if (document.visibilityState === 'visible') {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          // Use the same session across tabs - don't redirect
          setSession(data.session);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
