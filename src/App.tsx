
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "@/pages/Home";
import HomeV2 from "@/pages/HomeV2";
import AlchemistWorkshop from "@/pages/AlchemistWorkshop";
import AlchemyRecords from "@/pages/AlchemyRecords";
import ResumeRefine from "@/pages/ResumeRefine";
import ResumePreview from "@/pages/ResumePreview";
import Account from "@/pages/Account";
import Login from "@/pages/Login";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import FAQ from "@/pages/FAQ";
import Pricing from "@/pages/Pricing";
import SurveyPage from "@/pages/SurveyPage";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PaymentSuccess from "@/pages/PaymentSuccess";
import UserOnboard from "@/pages/UserOnboard";
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import JobWebsites from "@/pages/JobWebsites";

// Component to conditionally render the footer
const ConditionalFooter = () => {
  const location = useLocation();
  const hideFooterPaths = ['/resume-refine', '/resume-refine/:analysisId'];
  
  // Check if current path should hide footer
  const shouldHideFooter = hideFooterPaths.some(path => {
    if (path.includes(':')) {
      // For paths with parameters, check if the current path starts with the path without the parameter
      const basePath = path.split('/:')[0];
      return location.pathname.startsWith(basePath);
    }
    return location.pathname === path;
  });
  
  if (shouldHideFooter) {
    return null;
  }
  
  return <Footer />;
};

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/homev2" element={<HomeV2 />} />
              <Route 
                path="/alchemist-workshop" 
                element={
                  <ProtectedRoute>
                    <AlchemistWorkshop />
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
                path="/alchemy-records/:analysisId" 
                element={
                  <ProtectedRoute>
                    <AlchemyRecords />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/resume-refine" 
                element={
                  <ProtectedRoute>
                    <ResumeRefine />
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
              <Route path="/resume-preview" element={<ResumePreview />} />
              <Route path="/resume-preview/:analysisId" element={<ResumePreview />} />
              <Route 
                path="/account" 
                element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/user-onboard" 
                element={
                  <ProtectedRoute>
                    <UserOnboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/survey-page" element={<SurveyPage />} />
              <Route 
                path="/payment-success" 
                element={
                  <ProtectedRoute>
                    <PaymentSuccess />
                  </ProtectedRoute>
                }
              />
              <Route path="/job-websites" element={<JobWebsites />} />
            </Routes>
          </main>
          <ConditionalFooter />
          <Toaster />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
