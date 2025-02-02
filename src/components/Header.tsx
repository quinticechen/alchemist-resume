import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [usageCount, setUsageCount] = useState<number>(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUsageCount(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUsageCount(session.user.id);
      }
      console.log("Auth state changed:", _event, session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUsageCount = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('usage_count')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching usage count:', error);
      return;
    }
    
    setUsageCount(data?.usage_count || 0);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    } else {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
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

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center">
              <img 
                src="/lovable-uploads/646b205a-7bc6-432d-b8bc-f002fe2db329.png" 
                alt="ResumeAlchemist" 
                className="h-8"
              />
            </Link>
            <nav className="hidden sm:flex items-center gap-4 text-sm text-neutral-600">
              {session && (
                <Link 
                  to="/alchemist-workshop" 
                  className="hover:text-neutral-900 transition-colors"
                >
                  Alchemist Workshop
                </Link>
              )}
              <Link 
                to="/pricing" 
                className="hover:text-neutral-900 transition-colors"
              >
                Pricing
              </Link>
              {isHome && (
                <button
                  onClick={scrollToSupportedWebsites}
                  className="hover:text-neutral-900 transition-colors"
                >
                  Supported Websites
                </button>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-6">
            {session ? (
              <>
                <div className="flex items-center gap-3 text-neutral-600">
                  <User className="h-5 w-5" />
                  <span className="text-sm hidden sm:inline">
                    {session.user.email}
                  </span>
                  <span className="text-sm font-medium text-primary">
                    ({3 - (usageCount || 0)} uses left)
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2 border-neutral-200 hover:bg-neutral-100"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            ) : !isLogin && (
              <Button
                onClick={() => navigate("/login")}
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