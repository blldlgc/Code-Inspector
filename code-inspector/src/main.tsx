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
import MyPage from './pages/MyPage.tsx'
import CodeComparison from './pages/CodeComparison.tsx'
import { Code } from 'lucide-react'


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
      path: "/login",
      element: user ? <Navigate to="/" replace /> : <LoginPage />,
    }
  ]);

  return (
    <RouterProvider router={router} />
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
    <DialogComponent />
  </StrictMode>,
)
