import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, Github, Linkedin, Mail } from "lucide-react";

interface Profile {
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  usage_count: number;
  monthly_usage_count: number;
  provider: string;
  has_completed_survey: boolean;
  subscription_status: 'apprentice' | 'alchemist' | 'grandmaster';
}

interface Subscription {
  tier: 'apprentice' | 'alchemist' | 'grandmaster';
  current_period_end: string;
  cancel_at_period_end: boolean;
  status: string;
}

const Account = () => {
  const { session, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/login', { state: { from: '/account' } });
    }
  }, [session, authLoading, navigate]);

  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        throw subscriptionError;
      }

      setProfile(profile);
      setSubscription(subscription);
      setNewFullName(profile.full_name || "");
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderIcon = (provider: string | null) => {
    switch (provider?.toLowerCase()) {
      case 'github':
        return <Github className="h-4 w-4" />;
      case 'linkedin':
        return <Linkedin className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: newFullName })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, full_name: newFullName } : null);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const getUsageLimit = () => {
    if (!profile) return 0;
    switch (profile.subscription_status) {
      case 'grandmaster':
        return '∞';
      case 'alchemist':
        return 30;
      default:
        return 3;
    }
  };

  const getRemainingUses = () => {
    if (!profile) return 0;
    const limit = getUsageLimit();
    if (limit === '∞') return '∞';
    
    if (profile.subscription_status === 'alchemist') {
      return Math.max(0, Number(limit) - (profile.monthly_usage_count || 0));
    }
    
    return Math.max(0, Number(limit) - (profile.usage_count || 0));
  };

  const handleSubscribe = () => {
    navigate("/pricing");
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Manage your account details and subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-neutral-500">Email</h3>
              <p className="text-lg flex items-center gap-2">
                {profile?.email}
                {getProviderIcon(profile?.provider)}
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-neutral-500">Name</h3>
              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="Enter your name"
                  />
                  <Button onClick={handleUpdateProfile}>
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-lg">{profile?.full_name || 'Not provided'}</p>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-neutral-500">Usage</h3>
              <p className="text-lg">
                {profile?.subscription_status === 'alchemist' ? (
                  <>
                    {profile.monthly_usage_count || 0} resumes this month
                    <span className="text-sm text-neutral-500 ml-2">
                      ({getRemainingUses()} uses remaining this month)
                    </span>
                  </>
                ) : profile?.subscription_status === 'grandmaster' ? (
                  <>
                    {profile.usage_count || 0} resumes customized
                    <span className="text-sm text-neutral-500 ml-2">
                      (Unlimited uses)
                    </span>
                  </>
                ) : (
                  <>
                    {profile?.usage_count || 0} resumes customized
                    <span className="text-sm text-neutral-500 ml-2">
                      ({getRemainingUses()} free uses remaining)
                    </span>
                  </>
                )}
              </p>
              {profile?.subscription_status === 'apprentice' && profile?.usage_count && profile.usage_count >= 3 && (
                <p className="text-sm text-red-500">
                  You've reached the free trial limit. Subscribe to continue using the service.
                </p>
              )}
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-neutral-500 mb-4">Subscription Status</h3>
              {subscription && subscription.status === 'active' ? (
                <div className="space-y-3">
                  <div className="bg-green-50 text-green-700 px-4 py-2 rounded-md">
                    {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan
                    {subscription.current_period_end && (
                      <span className="block text-sm">
                        Current period ends: {new Date(subscription.current_period_end).toLocaleDateString()}
                        {subscription.cancel_at_period_end && " (Cancels at period end)"}
                      </span>
                    )}
                  </div>
                  <Button 
                    onClick={handleSubscribe}
                    className="w-full sm:w-auto"
                    variant="outline"
                  >
                    Manage Subscription
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-md">
                    Free Trial
                  </div>
                  <Button 
                    onClick={handleSubscribe}
                    className="w-full sm:w-auto bg-gradient-primary hover:opacity-90 transition-opacity"
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Account;
