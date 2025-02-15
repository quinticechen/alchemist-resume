
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubscriptionCheck } from "./useSubscriptionCheck";

export const useAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkSubscriptionAndRedirect } = useSubscriptionCheck();

  const handleSocialLogin = async (provider: 'google' | 'linkedin_oidc') => {
    try {
      setIsLoading(true);
      console.log(`Initiating ${provider} login...`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/alchemist-workshop`,
          queryParams: {
            prompt: 'consent'
          }
        },
      });
      
      if (error) throw error;
      
    } catch (error: any) {
      console.error(`${provider} login error:`, error);
      toast({
        title: "Authentication Error",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('Attempting email login/signup...');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address"
      });
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        console.log('Attempting signup...');
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/alchemist-workshop`,
            data: {
              email: email,
            }
          },
        });
        if (error) throw error;
        toast({
          title: "Success",
          description: "Please check your email to verify your account"
        });
      } else {
        console.log('Attempting signin...');
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        
        // Cache user profile data for faster access
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          // Store session in localStorage for persistence
          if (profile) {
            localStorage.setItem('userProfile', JSON.stringify({
              ...profile,
              cachedAt: Date.now()
            }));
          }

          await checkSubscriptionAndRedirect(data.user.id);
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isSignUp,
    setIsSignUp,
    isLoading,
    handleSocialLogin,
    handleEmailLogin
  };
};
