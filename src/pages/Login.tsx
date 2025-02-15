import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import SocialLogin from "@/components/auth/SocialLogin";
import EmailForm from "@/components/auth/EmailForm";

const Login = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const checkSubscriptionAndRedirect = async (userId: string) => {
    console.log('Checking subscription for user:', userId);
    
    try {
      // First check active subscription in subscriptions table
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')  // Select all fields for better debugging
        .eq('user_id', userId)
        .maybeSingle();

      if (subError) {
        console.error('Subscription check error:', subError);
        throw subError;
      }
      
      console.log('Full subscription data:', subscription);

      // Modified check for active subscription
      if (subscription && subscription.status === 'active' && 
          (subscription.tier === 'alchemist' || subscription.tier === 'grandmaster')) {
        console.log('Valid active subscription found:', subscription);
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in."
        });
        navigate('/alchemist-workshop');
        return;
      }

      // Only check profile if no active subscription found
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')  // Select all fields for better debugging
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Profile check error:', profileError);
        throw profileError;
      }

      console.log('Full profile data:', profile);

      if (!profile) {
        console.error('No profile found for user');
        throw new Error('No profile found');
      }

      // Check profile subscription status
      if (profile.subscription_status === 'grandmaster' || 
          profile.subscription_status === 'alchemist') {
        console.log('Premium status in profile:', profile.subscription_status);
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in."
        });
        navigate('/alchemist-workshop');
        return;
      }

      // Handle free trial user
      if (profile.usage_count >= profile.free_trial_limit) {
        console.log('Free trial limit reached:', {
          usage_count: profile.usage_count,
          limit: profile.free_trial_limit
        });
        
        if (!profile.has_completed_survey) {
          toast({
            title: "Survey Required",
            description: "Please complete the survey to continue using our services."
          });
          navigate('/survey-page');
        } else {
          toast({
            title: "Free Trial Completed",
            description: "Please upgrade to continue using our services."
          });
          navigate('/pricing');
        }
        return;
      }

      // Allow access for users within free trial
      console.log('User within free trial limits');
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in."
      });
      navigate('/alchemist-workshop');
    } catch (error) {
      console.error('Detailed subscription check error:', error);
      toast({
        title: "Error",
        description: "There was an error checking your subscription status."
      });
      // Default to login page on error
      navigate('/login');
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'linkedin_oidc') => {
    try {
      setIsLoading(true);
      console.log(`Initiating ${provider} login...`);
      
      const redirectTo = `${window.location.origin}/alchemist-workshop`;
      console.log('Redirect URL:', redirectTo);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
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
          password,
        });
        if (error) throw error;
        
        if (data.user) {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">ResumeAlchemist</h2>
            <p className="mt-2 text-sm text-gray-600">
              {isSignUp ? "Create your account" : "Sign in to your account"}
            </p>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <SocialLogin 
              onSocialLogin={handleSocialLogin}
              isLoading={isLoading}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with email
                </span>
              </div>
            </div>

            <EmailForm 
              email={email}
              password={password}
              isSignUp={isSignUp}
              isLoading={isLoading}
              onEmailChange={(e) => setEmail(e.target.value)}
              onPasswordChange={(e) => setPassword(e.target.value)}
              onSubmit={handleEmailLogin}
              onToggleMode={() => setIsSignUp(!isSignUp)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
