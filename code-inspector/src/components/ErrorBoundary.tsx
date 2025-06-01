import { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

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
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTitle>Bir hata oluştu</AlertTitle>
            <AlertDescription>
              {this.state.error?.message || 'Bilinmeyen bir hata oluştu.'}
            </AlertDescription>
          </Alert>
          <Button
            className="mt-4"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Tekrar Dene
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
} 