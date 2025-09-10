import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import MainPage from '@/pages/MainPage';
import LoginPage from '@/pages/LoginPage';
import CodeComparison from '@/pages/CodeComparison';
import CodeCoverage from '@/pages/CodeCoverage';
import MetricsAnalyzer from '@/pages/MetricsAnalyzer';
import TestGenerator from '@/pages/TestGenerator';
import CodeSmells from '@/pages/CodeSmells';
import CodeSecurity from '@/pages/CodeSecurity';
import CodeGraph from '@/pages/CodeGraph';
import CodeGraphComparison from '@/pages/CodeGraphComparison';
import AdminPanel from '@/pages/AdminPanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import MySidebar from '@/components/SidebarLayout';
import { Navigate } from 'react-router-dom';

export const AppRouter = () => {
  const { isAuthenticated } = useAuth();

  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <MySidebar>
            <MainPage />
          </MySidebar>
        </ProtectedRoute>
      ),
    },
    {
      path: "/clonedetector",
      element: (
        <ProtectedRoute>
          <MySidebar>
            <CodeComparison />
          </MySidebar>
        </ProtectedRoute>
      ),
    },
    {
      path: "/codegraph",
      element: (
        <ProtectedRoute>
          <MySidebar>
            <CodeGraph />
          </MySidebar>
        </ProtectedRoute>
      ),
    },
    {
      path: "/coverage",
      element: (
        <ProtectedRoute>
          <MySidebar>
            <CodeCoverage />
          </MySidebar>
        </ProtectedRoute>
      )
    },
    {
      path: "/metrics",
      element: (
        <ProtectedRoute>
          <MySidebar>
            <MetricsAnalyzer />
          </MySidebar>
        </ProtectedRoute>
      )
    },
    {
      path: "/testgenerator",
      element: (
        <ProtectedRoute>
          <MySidebar>
            <TestGenerator />
          </MySidebar>
        </ProtectedRoute>
      )
    },
    {
      path: "/codesmell",
      element: (
        <ProtectedRoute>
          <MySidebar>
            <CodeSmells />
          </MySidebar>
        </ProtectedRoute>
      )
    },
    {
      path: "/codesecurity",
      element: (
        <ProtectedRoute>
          <MySidebar>
            <CodeSecurity />
          </MySidebar>
        </ProtectedRoute>
      )
    },
    {
      path: "/login",
      element: isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />,
    },
    {
      path: "/codegraphcomparison",
      element: (
        <ProtectedRoute>
          <MySidebar>
            <ErrorBoundary>
              <CodeGraphComparison />
            </ErrorBoundary>
          </MySidebar>
        </ProtectedRoute>
      ),
    },
    {
      path: "/admin",
      element: (
        <AdminRoute>
          <MySidebar>
            <AdminPanel />
          </MySidebar>
        </AdminRoute>
      ),
    },
    {
      path: "*",
      element: <Navigate to="/" replace />
    }
  ]);

  return <RouterProvider router={router} />;
};
