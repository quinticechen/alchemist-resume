
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Home from "./pages/Home";
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

const queryClient = new QueryClient();

function AppContent() {
  const location = useLocation();
  const hideFooter = location.pathname.includes('/resume-refine');

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex flex-col">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/home" element={<Home />} />
          <Route path="/home-v2" element={<HomeV2 />} />
          <Route path="/login" element={<Login />} />
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
              <ProtectedRoute>
                <ResumeRefine />
              </ProtectedRoute>
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
            path="/resume-preview/:analysisId?"
            element={
              <ProtectedRoute>
                <ResumePreview />
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
            path="/onboard"
            element={
              <ProtectedRoute>
                <UserOnboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/survey"
            element={
              <ProtectedRoute>
                <SurveyPage />
              </ProtectedRoute>
            }
          />
          <Route path="/job-websites" element={<JobWebsites />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route
            path="/payment-success"
            element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ScrollToTop />
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
