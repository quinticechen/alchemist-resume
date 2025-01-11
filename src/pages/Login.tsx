import { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"sign_in" | "sign_up" | "forgotten_password">("sign_in");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      
      if (event === "SIGNED_IN") {
        toast({
          title: "Welcome!",
          description: "You have successfully signed in.",
        });
        navigate("/");
      }

      // Handle authentication errors
      if (event === "USER_UPDATED" && !session) {
        setError("Invalid email or password. Please check your credentials or sign up if you don't have an account.");
      }

      // Update view based on auth events
      if (event === "PASSWORD_RECOVERY") {
        setView("forgotten_password");
      } else if (event === "USER_UPDATED" && session?.user.email_confirmed_at) {
        // User has confirmed their email, switch to sign in view
        setView("sign_in");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const getSubtitle = () => {
    switch (view) {
      case "sign_in":
        return "Sign in to your account";
      case "sign_up":
        return "Create your account";
      case "forgotten_password":
        return "Reset your password";
      default:
        return "Sign in to your account";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary">Resume Matcher</h1>
            <p className="mt-2 text-gray-600">{getSubtitle()}</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#1a365d",
                    brandAccent: "#1a365d",
                  },
                },
              },
              className: {
                button: "bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors",
                container: "space-y-4",
                label: "block text-sm font-medium text-gray-700",
                input: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm",
              },
            }}
            providers={[]} // Remove all social providers
            redirectTo={window.location.origin}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;