import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { HelmetProvider } from 'react-helmet-async';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import LanguageRouter from "@/components/LanguageRouter";
import { AuthProvider } from "@/contexts/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";

// Pages
import Index from "./pages/Index";
import HomeV2 from "./pages/HomeV2";
import Login from "./pages/Login";
import AlchemistWorkshop from "./pages/AlchemistWorkshop";
import ResumeRefine from "./pages/ResumeRefine";
import AlchemyRecords from "./pages/AlchemyRecords";
import ResumePreview from "./pages/ResumePreview";
import Account from "./pages/Account";
import UserOnboard from "./pages/UserOnboard";
import SurveyPage from "./pages/SurveyPage";
import JobWebsites from "./pages/JobWebsites";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import CoverLetter from "./pages/CoverLetter";
import CompanyResearch from "./pages/CompanyResearch";
import OAuthCallback from "./components/OAuthCallback";

const queryClient = new QueryClient();

// Language-aware route wrapper
const LanguageRoute: React.FC<{ children: React.ReactNode; hideHeaderFooter?: boolean }> = ({ children, hideHeaderFooter = false }) => (
  <div className="min-h-screen flex flex-col">
    {!hideHeaderFooter && <Header />}
    <main className="flex-1">
      {children}
    </main>
    {!hideHeaderFooter && <Footer />}
  </div>
);

const AppContent = () => {
  return (
    <Routes>
      {/* OAuth callback route - bypasses language routing */}
      <Route path="/auth/callback" element={<OAuthCallback />} />
      
      {/* Root redirect to default language */}
      <Route path="/" element={<Navigate to="/en" replace />} />
      
      {/* Language-prefixed routes */}
      <Route path="/:lang/*" element={
        <LanguageRoute>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/home" element={<HomeV2 />} />
            <Route path="/login" element={<Login />} />
            <Route path="/user-onboard" element={<UserOnboard />} />
            <Route path="/survey" element={<SurveyPage />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/job-websites" element={<JobWebsites />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            
            {/* Protected routes */}
            <Route
              path="/alchemist-workshop"
              element={
                <ProtectedRoute>
                  <AlchemistWorkshop />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resume-refine/:analysisId"
              element={
                <div className="min-h-screen">
                  <ProtectedRoute>
                    <ResumeRefine />
                  </ProtectedRoute>
                </div>
              }
            />
            <Route
              path="/alchemy-records"
              element={
                <ProtectedRoute>
                  <AlchemyRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cover-letter"
              element={
                <ProtectedRoute>
                  <CoverLetter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resume-preview/:analysisId?"
              element={
                <ProtectedRoute>
                  <ResumePreview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-success"
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company-research/:jobId"
              element={
                <ProtectedRoute>
                  <CompanyResearch />
                </ProtectedRoute>
              }
            />
          </Routes>
        </LanguageRoute>
      } />
      
      {/* Catch-all redirect to default language */}
      <Route path="*" element={<Navigate to="/en" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <React.StrictMode>
      <HelmetProvider>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <TooltipProvider>
                <LanguageRouter>
                  <ScrollToTop />
                  <AppContent />
                </LanguageRouter>
                <Toaster />
                <Sonner />
              </TooltipProvider>
            </AuthProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </HelmetProvider>
    </React.StrictMode>
  );
}

export default App;