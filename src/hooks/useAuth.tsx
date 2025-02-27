
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useToast } from "@/hooks/use-toast";
// import { supabase } from "@/integrations/supabase/client";

// export const useAuth = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [isSignUp, setIsSignUp] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const navigate = useNavigate();
//   const { toast } = useToast();

//   const checkUserAccess = async (userId: string) => {
//     // First check profile status
//     const { data: profile } = await supabase
//       .from('profiles')
//       .select('subscription_status, usage_count, free_trial_limit, monthly_usage_count')
//       .eq('id', userId)
//       .single();

//     if (!profile) {
//       return false;
//     }

//     // For Apprentice: Check free trial usage
//     if (profile.subscription_status === 'apprentice') {
//       return profile.usage_count < profile.free_trial_limit;
//     }

//     // For Alchemist: Check monthly usage
//     if (profile.subscription_status === 'alchemist') {
//       return (profile.monthly_usage_count || 0) < 30;
//     }

//     // For Grandmaster: Check subscription period
//     if (profile.subscription_status === 'grandmaster') {
//       const { data: subscription } = await supabase
//         .from('subscriptions')
//         .select('current_period_end')
//         .eq('user_id', userId)
//         .eq('status', 'active')
//         .maybeSingle();

//       if (subscription?.current_period_end) {
//         return new Date(subscription.current_period_end) > new Date();
//       }
//     }

//     return false;
//   };

//   const handleAuthSuccess = async (userId: string) => {
//     // Show single welcome toast
//     toast({
//       title: "Welcome back!",
//       description: "Successfully signed in"
//     });

//     // Check user access and redirect accordingly
//     const hasAccess = await checkUserAccess(userId);
//     navigate(hasAccess ? '/alchemist-workshop' : '/pricing');
//   };

//   const handleSocialLogin = async (provider: 'google' | 'linkedin_oidc') => {
//     try {
//       setIsLoading(true);
      
//       const { data, error } = await supabase.auth.signInWithOAuth({
//         provider,
//         options: {
//           queryParams: {
//             prompt: 'consent'
//           }
//         },
//       });
      
//       if (error) throw error;
      
//       // For OAuth, we'll handle the redirect in the Auth state change listener
//       // This is because OAuth redirects to a new page and we lose our state
      
//     } catch (error: any) {
//       console.error(`${provider} login error:`, error);
//       toast({
//         title: "Authentication Error",
//         description: error.message
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleEmailLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       toast({
//         title: "Invalid Email",
//         description: "Please enter a valid email address"
//       });
//       setIsLoading(false);
//       return;
//     }

//     try {
//       if (isSignUp) {
//         const { error } = await supabase.auth.signUp({
//           email,
//           password,
//           options: {
//             emailRedirectTo: `${window.location.origin}/alchemist-workshop`,
//           },
//         });
//         if (error) throw error;
//         toast({
//           title: "Success",
//           description: "Please check your email to verify your account"
//         });
//       } else {
//         const { data, error } = await supabase.auth.signInWithPassword({
//           email,
//           password,
//         });
//         if (error) throw error;

//         await handleAuthSuccess(data.user.id);
//       }
//     } catch (error: any) {
//       console.error('Auth error:', error);
//       toast({
//         title: "Error",
//         description: error.message
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return {
//     email,
//     setEmail,
//     password,
//     setPassword,
//     isSignUp,
//     setIsSignUp,
//     isLoading,
//     handleSocialLogin,
//     handleEmailLogin,
//     handleAuthSuccess
//   };
// };
