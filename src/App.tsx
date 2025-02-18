
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "@/pages/Home";
import AlchemistWorkshop from "@/pages/AlchemistWorkshop";
import AlchemyRecords from "@/pages/AlchemyRecords";
import Account from "@/pages/Account";
import Login from "@/pages/Login";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import FAQ from "@/pages/FAQ";
import Pricing from "@/pages/Pricing";
import SurveyPage from "@/pages/SurveyPage";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const App = () => {
  return (
    <AuthProvider>
      <Router>
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
              <Route path="/account" element={<Account />} />
              <Route path="/login" element={<Login />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/survey-page" element={<SurveyPage />} />
            </Routes>
          </main>
          <Footer />
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
