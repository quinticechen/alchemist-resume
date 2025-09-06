import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Lock, Mail, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

interface EmailFormProps {
  email: string;
  password: string;
  isSignUp: boolean;
  isLoading: boolean;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onToggleMode: () => void;
}

const EmailForm = ({
  email,
  password,
  isSignUp,
  isLoading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onToggleMode,
}: EmailFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={onEmailChange}
            className="pl-10"
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={onPasswordChange}
            className="pl-10"
            required
          />
        </div>
        {isSignUp && (
          <div className="flex items-start mt-2">
            <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
            <p className="text-xs text-gray-500">
              Password must be at least 8 characters long and contain uppercase, lowercase letters and numbers
            </p>
          </div>
        )}
      </div>
      <Button className="w-full" type="submit" disabled={isLoading}>
        <LogIn className="w-5 h-5 mr-2" />
        {isLoading ? "Loading..." : isSignUp ? "Sign up" : "Sign in"}
      </Button>
      <div className="text-center space-y-2">
        <button
          type="button"
          onClick={onToggleMode}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Don't have an account? Sign up"}
        </button>
        
        {!isSignUp && (
          <div>
            <Link 
              to="/en/forgot-password"
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Forgot your password?
            </Link>
          </div>
        )}
      </div>
    </form>
  );
};

export default EmailForm;