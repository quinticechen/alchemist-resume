import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Footer = () => {
  const { toast } = useToast();

  const handleEmailClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const email = "support@resumealchemist.com";
    navigator.clipboard.writeText(email);
    toast({
      title: "Email Copied",
      description: "Support email has been copied to your clipboard",
    });
  };

  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <Link
              to="/terms"
              className="text-sm text-neutral-600 hover:text-primary transition-colors"
            >
              Terms
            </Link>
            <Link
              to="/privacy"
              className="text-sm text-neutral-600 hover:text-primary transition-colors"
            >
              Privacy
            </Link>
            <a
              href="mailto:support@resumealchemist.com"
              onClick={handleEmailClick}
              className="text-sm text-neutral-600 hover:text-primary transition-colors"
            >
              Support
            </a>
          </div>
          <div className="text-sm text-neutral-600">
            © {new Date().getFullYear()} ResumeAlchemist. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;