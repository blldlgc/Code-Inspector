import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { authService, User } from '@/lib/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());

  useEffect(() => {
    // LocalStorage değişikliklerini dinle
    const handleStorageChange = () => {
      console.log('AuthContext - Storage changed');
      const user = authService.getCurrentUser();
      console.log('AuthContext - New user data:', user);
      setIsAuthenticated(authService.isAuthenticated());
      setCurrentUser(user);
    };

    // Periyodik token kontrolü (her 5 dakikada bir)
    const tokenCheckInterval = setInterval(() => {
      if (authService.isAuthenticated()) {
        // Token hala geçerli, durumu güncelle
        setIsAuthenticated(true);
        setCurrentUser(authService.getCurrentUser());
      } else {
        // Token süresi geçmiş, durumu güncelle
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    }, 5 * 60 * 1000); // 5 dakika

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(tokenCheckInterval);
    };
  }, []);

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
