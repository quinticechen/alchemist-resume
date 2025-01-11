import { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthError } from "@supabase/supabase-js";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

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
      
      if (event === "SIGNED_IN" && session) {
        toast({
          title: "Welcome!",
          description: "You have successfully signed in.",
        });
        navigate("/");
      }

      if (event === "USER_UPDATED" && !session) {
        setError("Invalid email or password. Please try again.");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleAuthError = (error: AuthError) => {
    console.error("Auth error:", error);
    let errorMessage = "An error occurred during authentication. Please try again.";
    
    if (error.message.includes("Invalid login credentials")) {
      errorMessage = "Invalid email or password. Please check your credentials.";
    }
    
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary">Resume Matcher</h1>
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
            providers={[]}
            redirectTo={`${window.location.origin}/`}
            magicLink={false}
            onError={handleAuthError}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;