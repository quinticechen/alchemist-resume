import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      console.log("Auth state changed:", _event, session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
      navigate("/login");
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div 
            onClick={() => navigate("/")} 
            className="text-xl font-semibold bg-gradient-primary text-transparent bg-clip-text cursor-pointer hover:opacity-80 transition-opacity"
          >
            ResumeAlchemist
          </div>
          <div className="flex items-center gap-6">
            {session ? (
              <>
                <div className="flex items-center gap-3 text-neutral-600">
                  <User className="h-5 w-5" />
                  <span className="text-sm hidden sm:inline">
                    {session.user.email}
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
            ) : location.pathname !== "/login" ? (
              <Button
                onClick={() => navigate("/login")}
                size="sm"
                className="flex items-center gap-2 bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;