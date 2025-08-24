import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Lottie from "react-lottie";
import Loading from "@/animations/Loading.json";

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();

  const loadingOptions = {
    loop: true,
    autoplay: true,
    animationData: Loading,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('OAuthCallback: Processing OAuth callback');
        
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('OAuth callback error:', error);
          navigate('/en/login');
          return;
        }

        if (data.session) {
          console.log('OAuth callback successful, redirecting...');
          // Successful authentication - redirect to alchemist workshop
          navigate('/en/alchemist-workshop');
        } else {
          console.log('No session found, redirecting to login');
          navigate('/en/login');
        }
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
        navigate('/en/login');
      }
    };

    // Small delay to ensure URL params are processed
    const timer = setTimeout(handleAuthCallback, 500);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-64 h-64 mx-auto">
          <Lottie options={loadingOptions} />
        </div>
        <p className="mt-4 text-lg text-muted-foreground">
          Completing authentication...
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;