import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check } from "lucide-react";

interface Profile {
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  usage_count: number;
  provider: string;
}

const Account = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
    checkSubscriptionStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(profile);
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

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/check-subscription', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      const data = await response.json();
      setIsSubscribed(data.subscribed);
    } catch (error) {
      console.error('Error checking subscription:', error);
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

  const handleSubscribe = async () => {
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to initiate subscription process",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
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
                {profile?.provider && (
                  <span className="text-sm text-neutral-500">
                    via {profile.provider}
                  </span>
                )}
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
                {profile?.usage_count || 0} resumes customized
                <span className="text-sm text-neutral-500 ml-2">
                  ({3 - (profile?.usage_count || 0)} free uses remaining)
                </span>
              </p>
              {!isSubscribed && profile?.usage_count && profile.usage_count >= 3 && (
                <p className="text-sm text-red-500">
                  You've reached the free trial limit. Subscribe to continue using the service.
                </p>
              )}
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-neutral-500 mb-4">Subscription Status</h3>
              {isSubscribed ? (
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-md">
                  Active Subscription
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-md">
                    Free Trial
                  </div>
                  <Button 
                    onClick={handleSubscribe}
                    className="w-full sm:w-auto"
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