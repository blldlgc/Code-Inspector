import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();

  console.log('AdminRoute - Auth Check:', {
    isAuthenticated,
    currentUser,
    hasUser: !!currentUser,
    userRole: currentUser?.role,
    userRoleType: typeof currentUser?.role,
    roleCheck: `${currentUser?.role} === 'ROLE_ADMIN'`,
    hasAdminRole: currentUser?.role === 'ROLE_ADMIN'
  });

  if (!isAuthenticated) {
    console.log('AdminRoute - Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (currentUser?.role !== 'ROLE_ADMIN') {
    console.log('AdminRoute - Not admin, redirecting to home. Current role:', currentUser?.role);
    return <Navigate to="/" replace />;
  }

  console.log('AdminRoute - Access granted to admin panel');

  return <>{children}</>;
};

export default AdminRoute;


