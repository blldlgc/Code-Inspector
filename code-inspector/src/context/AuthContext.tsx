import React, { createContext, useContext, ReactNode } from 'react';
import { authService } from '@/lib/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: any;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  const logout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
