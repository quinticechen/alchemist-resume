import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogOut, CreditCard, User, Shield, AlertTriangle } from "lucide-react";
import JellyfishAnimation from "@/components/JellyfishAnimation";

const Account = () => {
  const { session, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isLoading && !session) {
      navigate("/login", { state: { from: "/account" } });
    }
  }, [session, isLoading, navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoadingProfile(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) throw error;
        setUserProfile(data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    const fetchSubscription = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoadingSubscription(true);
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*, subscription_items(*)")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setSubscription(data);
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    if (session?.user?.id) {
      fetchUserProfile();
      fetchSubscription();
    }
  }, [session]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) return;

    try {
      setIsDeleting(true);
      
      // Delete user data from various tables
      await Promise.all([
        supabase.from("profiles").delete().eq("id", session.user.id),
        supabase.from("subscriptions").delete().eq("user_id", session.user.id),
        supabase.from("resume_analyses").delete().eq("user_id", session.user.id),
        supabase.from("resumes").delete().eq("user_id", session.user.id),
      ]);

      // Delete the user auth record
      const { error } = await supabase.auth.admin.deleteUser(session.user.id);
      
      if (error) throw error;

      await signOut();
      navigate("/");
      
      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been deleted.",
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getSubscriptionStatus = () => {
    if (!subscription) return "Free";
    
    const status = subscription.status;
    if (status === "active") return "Active";
    if (status === "trialing") return "Trial";
    if (status === "canceled") return "Canceled";
    if (status === "past_due") return "Past Due";
    return "Inactive";
  };

  const getSubscriptionPlan = () => {
    if (!subscription) return "Free Plan";
    
    const items = subscription.subscription_items;
    if (!items || items.length === 0) return "Unknown Plan";
    
    const planId = items[0]?.price?.product?.name || "Premium Plan";
    return planId;
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 relative">
          <h1 className="text-4xl font-bold bg-gradient-primary text-transparent bg-clip-text mb-4">
            Your Account
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your account settings and subscription details.
          </p>
          
          <div className="absolute top-0 right-0">
            <JellyfishAnimation width={120} height={120} className="opacity-80" />
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  View and manage your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingProfile ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Email</h3>
                        <p className="mt-1">{session.user.email}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Account Created</h3>
                        <p className="mt-1">{formatDate(session.user.created_at || '')}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Last Sign In</h3>
                        <p className="mt-1">{formatDate(session.user.last_sign_in_at || '')}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
                <CardDescription>
                  Manage your subscription and billing information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingSubscription ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Current Plan</h3>
                        <p className="mt-1">{getSubscriptionPlan()}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Status</h3>
                        <p className="mt-1">{getSubscriptionStatus()}</p>
                      </div>
                      {subscription && (
                        <>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Started On</h3>
                            <p className="mt-1">{formatDate(subscription.created_at)}</p>
                          </div>
                          {subscription.cancel_at && (
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Ends On</h3>
                              <p className="mt-1">{formatDate(subscription.cancel_at)}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="pt-4">
                      <Button
                        onClick={() => navigate("/pricing")}
                        variant="outline"
                      >
                        {subscription ? "Manage Subscription" : "View Plans"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and privacy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Button
                      onClick={handleSignOut}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>

                  <div className="pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-red-600 mb-2">Danger Zone</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button
                      onClick={() => setShowDeleteDialog(true)}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Account;
