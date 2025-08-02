import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { Mail, Facebook, Twitter, Instagram, Linkedin, Copyright } from "lucide-react";
import Logo from "./header/Logo";

const Footer = () => {
  const { t } = useTranslation('home');
  const { toast } = useToast();
  const supportEmail = "resumealchemist.qwizai@gmail.com";

  const handleEmailClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(supportEmail);
    toast({
      title: "Email Copied",
      description: "Support email has been copied to your clipboard",
    });
  };

  const socialLinks = [
    // {
    //   name: "Facebook",
    //   icon: <Facebook className="h-5 w-5" />,
    //   url: "https://facebook.com/resumealchemist",
    // },
    // {
    //   name: "Twitter",
    //   icon: <Twitter className="h-5 w-5" />,
    //   url: "https://twitter.com/resumealchemist",
    // },
    {
      name: "Instagram",
      icon: <Instagram className="h-5 w-5" />,
      url: "https://instagram.com/resume.alchemist",
    },
    {
      name: "Linkedin",
      icon: <Linkedin className="h-5 w-5" />,
      url: "https://linkedin.com/company/qwizai",
    },
  ];
  

  return (
    <footer className="bg-[#ffffff] border-t border-neutral-200">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Logo />
            <div className="flex items-center text-sm text-neutral-600">
              <Copyright className="h-4 w-4 mr-2" />
              <span>{new Date().getFullYear()} {t('footer.company', { defaultValue: 'ResumeAlchemist' })}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.quickLinks', { defaultValue: 'Quick Links' })}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/terms"
                  className="text-sm text-neutral-600 hover:text-primary transition-colors flex items-center"
                >
                  {/* <LinkIcon className="h-4 w-4 mr-2" /> */}
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-neutral-600 hover:text-primary transition-colors flex items-center"
                >
                  {/* <LinkIcon className="h-4 w-4 mr-2" /> */}
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-sm text-neutral-600 hover:text-primary transition-colors flex items-center"
                >
                  {/* <LinkIcon className="h-4 w-4 mr-2" /> */}
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-sm text-neutral-600 hover:text-primary transition-colors flex items-center"
                >
                  {/* <LinkIcon className="h-4 w-4 mr-2" /> */}
                  Pricing Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.contact', { defaultValue: 'Contact Us' })}</h3>
            <div className="space-y-2">
              <a
                href={`mailto:${supportEmail}`}
                onClick={handleEmailClick}
                className="text-sm text-neutral-600 hover:text-primary transition-colors flex items-center cursor-pointer"
              >
                <Mail className="h-4 w-4 mr-2" />
                {supportEmail}
              </a>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.followUs', { defaultValue: 'Follow Us' })}</h3>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-600 hover:text-primary transition-colors"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;