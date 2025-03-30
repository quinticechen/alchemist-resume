
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "@/pages/Home";
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
import HomeV2 from "@/pages/HomeV2";
import UserOnboard from "@/pages/UserOnboard";
import ScrollToTop from './components/ScrollToTop';

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
              <Route 
                path="/alchemist-workshop" 
                element={<AlchemistWorkshop />}
              />
              <Route 
                path="/alchemy-records" 
                element={<AlchemyRecords />}
              />
              <Route 
                path="/alchemy-records/:analysisId" 
                element={<AlchemyRecords />}
              />
              <Route 
                path="/resume-refine" 
                element={<ResumeRefine />}
              />
              <Route 
                path="/resume-refine/:analysisId" 
                element={<ResumeRefine />}
              />
              <Route 
                path="/resume-preview" 
                element={<ResumePreview />}
              />
              <Route 
                path="/resume-preview/:analysisId" 
                element={<ResumePreview />}
              />
              <Route path="/account" element={<Account />} />
              <Route path="/login" element={<Login />} />
              <Route path="/user-onboard" element={<UserOnboard />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/survey-page" element={<SurveyPage />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/homev2" element={<HomeV2 />} />
            </Routes>
          </main>
          <Footer />
          <Toaster />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
