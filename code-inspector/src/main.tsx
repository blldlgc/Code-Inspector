import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import MainPage from './pages/MainPage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import './index.css'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { DialogComponent } from './components/DialogManager';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import { auth } from '@/config/firebase';
import MySidebar from './components/SidebarLayout.tsx';
import CodeComparison from './pages/CodeComparison.tsx'
import CodeGraph from './pages/CodeGraph.tsx'
import TreeSitter from './pages/TreeSitter.tsx'
import CodeCoverage from './pages/CodeCoverage.tsx'
import MetricsAnalyzer from './pages/MetricsAnalyzer.tsx'
import { ThemeProvider } from "./components/theme-provider"



const AppRouter = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div></div>;
  }

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
      path: "/codecomparison",
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
            <TreeSitter />
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
      path: "/login",
      element: user ? <Navigate to="/" replace /> : <LoginPage />,
    },
    {
      path: "*",
      element: <Navigate to="/" replace />
    }
  ]);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <RouterProvider router={router} />
      <DialogComponent />
    </ThemeProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
