
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login'
}) => {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show a loading state while checking authentication
    return <div className="container mx-auto py-8 text-center">Loading...</div>;
  }

  if (!session) {
    // Redirect to login page with the return path
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
