import { Mail, Facebook, Twitter, Instagram, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Footer = () => {
  const { toast } = useToast();

  const handleContactSupport = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email;

      if (!userEmail) {
        toast({
          title: "Error",
          description: "Please log in to contact support",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.functions.invoke('send-support-email', {
        body: {
          userEmail,
          message: "Support request from Resume Alchemist user",
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Support request sent successfully. We'll get back to you soon!",
      });
    } catch (error) {
      console.error('Error sending support email:', error);
      toast({
        title: "Error",
        description: "Failed to send support request. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <img src="/lovable-uploads/646b205a-7bc6-432d-b8bc-f002fe2db329.png" alt="ResumeAlchemist" className="h-8" />
            </div>
            <p className="text-sm text-neutral-600">
              Transform your resume with AI-powered customization
            </p>
            <p className="text-sm text-neutral-500">
              © {new Date().getFullYear()} ResumeAlchemist. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>
                <Link to="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>
                <Link to="/faq" className="hover:text-primary transition-colors">
                  <HelpCircle className="h-4 w-4 inline-block mr-2" />
                  FAQ
                </Link>
              </li>
              <li>
                <button 
                  onClick={handleContactSupport}
                  className="hover:text-primary transition-colors flex items-center"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </button>
              </li>
            </ul>
          </div>

          {/* Social & Plans */}
          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <div className="flex space-x-4 mb-4">
              <a href="#" className="text-neutral-600 hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-600 hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-600 hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
            <Link 
              to="/pricing" 
              className="text-sm text-neutral-600 hover:text-primary transition-colors"
            >
              View Subscription Plans
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;