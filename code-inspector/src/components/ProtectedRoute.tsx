import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Sayfa yüklendiğinde token kontrolü yap
    if (authService.isAuthenticated()) {
      // Token geçerli, durumu güncelle
      return;
    } else {
      // Token geçersiz, zaten isAuthenticated false döndürecek
      return;
    }
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;