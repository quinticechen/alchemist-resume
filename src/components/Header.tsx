
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Logo from "./header/Logo";
import Navigation from "./header/Navigation";
import UserMenu from "./header/UserMenu";

const Header = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [usageCount, setUsageCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(currentSession);
          if (currentSession?.user) {
            await fetchUsageCount(currentSession.user.id);
          }
        }
      } catch (error) {
        console.error("Session initialization error:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state changed:", event, newSession);
      if (isMounted) {
        setSession(newSession);
        if (event === 'SIGNED_IN' && newSession?.user) {
          await fetchUsageCount(newSession.user.id);
          if (location.pathname === '/') {
            navigate('/alchemist-workshop');
          }
        } else if (event === 'SIGNED_OUT') {
          setUsageCount(0);
          if (location.pathname !== '/') {
            navigate('/');
          }
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const fetchUsageCount = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('usage_count')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      setUsageCount(data?.usage_count || 0);
    } catch (error) {
      console.error('Error fetching usage count:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    }
  };

  const isHome = location.pathname === "/";
  const isLogin = location.pathname === "/login";

  const scrollToSupportedWebsites = () => {
    const element = document.getElementById('supported-websites');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else if (!isHome) {
      navigate('/#supported-websites');
    }
  };

  const handleAuthClick = () => {
    if (session) {
      navigate("/alchemist-workshop");
    } else {
      navigate("/login");
    }
  };

  // Always render the header content, even during loading
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Logo />
            <Navigation 
              session={session} 
              onSupportedWebsitesClick={scrollToSupportedWebsites}
              isHome={isHome}
            />
          </div>
          <div className="flex items-center gap-6">
            {session ? (
              <UserMenu 
                session={session}
                usageCount={usageCount}
                onLogout={handleLogout}
              />
            ) : !isLogin && (
              <Button
                onClick={handleAuthClick}
                size="sm"
                className="flex items-center gap-2 bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                <LogIn className="h-4 w-4" />
                {isHome ? "Start Free Trial" : "Sign In"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
