import { Button } from "@/components/ui/button";
import { Linkedin } from "lucide-react";

interface SocialLoginProps {
  onSocialLogin: (provider: 'google' | 'linkedin_oidc') => Promise<void>;
  isLoading: boolean;
}

const SocialLogin = ({ onSocialLogin, isLoading }: SocialLoginProps) => {
  return (
    <div className="grid gap-3">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => onSocialLogin('google')}
        disabled={isLoading}
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          className="w-5 h-5 mr-2"
        />
        Continue with Google
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => onSocialLogin('linkedin_oidc')}
        disabled={isLoading}
      >
        <Linkedin className="w-5 h-5 mr-2" />
        Continue with LinkedIn
      </Button>
    </div>
  );
};

export default SocialLogin;