
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import AlchemistWorkshop from "@/pages/AlchemyStation";
import AlchemyRecords from "@/pages/AlchemyRecords";
import Account from "@/pages/Account";
import Login from "@/pages/Login";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import FAQ from "@/pages/FAQ";
import Pricing from "@/pages/Pricing";
import PrePricing from "@/pages/PrePricing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

// Create a wrapper component to handle auth state
const AuthWrapper = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Initializing auth...");
    
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          return;
        }
        console.log('Initial session:', session);
        setSession(session);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setSession(session);
      setIsLoading(false);
      
      // Use React Router navigation instead of window.location
      if (_event === 'SIGNED_IN') {
        navigate('/alchemist-workshop');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/alchemist-workshop" 
            element={
              session ? (
                <AlchemistWorkshop />
              ) : (
                <Navigate to="/login" replace state={{ from: "/alchemist-workshop" }} />
              )
            } 
          />
          <Route 
            path="/alchemy-records" 
            element={
              session ? (
                <AlchemyRecords />
              ) : (
                <Navigate to="/login" replace state={{ from: "/alchemy-records" }} />
              )
            } 
          />
          <Route 
            path="/account" 
            element={
              session ? (
                <Account />
              ) : (
                <Navigate to="/login" replace state={{ from: "/account" }} />
              )
            } 
          />
          <Route 
            path="/login" 
            element={
              session ? (
                <Navigate to="/alchemist-workshop" replace />
              ) : (
                <Login />
              )
            } 
          />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/pre-pricing" element={<PrePricing />} />
        </Routes>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
};

// Main App component
function App() {
  return (
    <Router>
      <AuthWrapper />
    </Router>
  );
}

export default App;
