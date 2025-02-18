
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SocialLogin from "@/components/auth/SocialLogin";
import EmailForm from "@/components/auth/EmailForm";
import { useAuth } from "@/hooks/useAuth";
import { trackLogin, trackSignUp } from "@/utils/gtm";

const Login = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    isSignUp,
    setIsSignUp,
    isLoading,
    handleSocialLogin,
    handleEmailLogin
  } = useAuth();

  const handleSocialLoginWithTracking = async (provider: 'google' | 'linkedin_oidc') => {
    const providerName = provider === 'linkedin_oidc' ? 'LinkedIn' : 'Google';
    if (isSignUp) {
      trackSignUp(providerName);
    } else {
      trackLogin(providerName);
    }
    await handleSocialLogin(provider);
  };

  const handleEmailLoginWithTracking = async (e: React.FormEvent) => {
    if (isSignUp) {
      trackSignUp('Email');
    } else {
      trackLogin('Email');
    }
    await handleEmailLogin(e);
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
              onSocialLogin={handleSocialLoginWithTracking}
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
              onSubmit={handleEmailLoginWithTracking}
              onToggleMode={() => setIsSignUp(!isSignUp)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
