import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-lg bg-card p-8 shadow-lg">
            <h2 className="mb-4 text-2xl font-bold text-destructive">Oops, bir şeyler yanlış gitti!</h2>
            <p className="mb-4 text-muted-foreground">
              {this.state.error?.message || 'Beklenmeyen bir hata oluştu.'}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
            >
              Ana Sayfaya Dön
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
