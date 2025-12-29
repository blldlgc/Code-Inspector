import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from './components/ui/sonner.tsx'
import { DialogComponent } from './components/DialogManager';
import { AuthProvider } from '@/context/AuthContext';
import { AccessibilityProvider } from '@/context/AccessibilityContext';
import { AppRouter } from './routes/AppRouter';
import { authService } from '@/lib/auth';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import '@/lib/logger'; // Logger utility'yi yükle

// Auth interceptor'ı başlat
authService.setupAxiosInterceptors();

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <AccessibilityProvider>
          <AppRouter />
          <DialogComponent />
          <Toaster />
          </AccessibilityProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
