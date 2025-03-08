
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>; // Add signOut method to the interface
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  signOut: async () => {}, // Provide a default implementation
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Implement the signOut method
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Clear any user-related data from local storage when signing out
      localStorage.removeItem('userProfile');
      sessionStorage.removeItem('userAuthenticated');
      sessionStorage.removeItem('hasVisitedWorkshop');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    console.log("Initial session check:", session);
    
    // Track user authentication state in session storage to avoid showing welcome toast repeatedly
    const trackAuthState = () => {
      if (session?.user?.id) {
        // User is signed in, set the auth state in session storage
        sessionStorage.setItem('userAuthenticated', 'true');
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event, {
        "_type": typeof newSession,
        "value": String(newSession)
      });
      console.log("Auth state changed:", event, newSession);
      
      setSession(newSession);
      setIsLoading(false);
      
      // Track auth state when session changes
      if (newSession) {
        trackAuthState();
      }
    });

    // Initial auth check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
      
      // Track auth state on initial load
      if (session) {
        trackAuthState();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
