import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Lottie from "react-lottie";
import Loading from "@/animations/Loading.json";
import OozeDialog from "@/components/OozeDialog";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = "/login",
}) => {
  const { session, isLoading } = useAuth();
  const location = useLocation();
  const loadingOptions = {
    loop: true,
    autoplay: true,
    animationData: Loading,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  
  if (isLoading) {
    // Show a loading state while checking authentication
    return (
      <div className="w-64 h-64 mx-auto">
        <Lottie options={loadingOptions} />
      </div>
    );
  }

  if (!session) {
    // Redirect to login page with the return path
    return (
      <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
