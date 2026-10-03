import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      'Error caught by Chitram ErrorBoundary:',
      error?.message || String(error),
      errorInfo?.componentStack || ''
    );
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('chitram_custom_movies');
      localStorage.removeItem('chitram_downloads');
    } catch {}
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-6 rounded-2xl bg-neutral-950 border border-neutral-800">
            <h1 className="text-xl font-black uppercase tracking-tight text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-xs text-neutral-400 mb-6">
              An unexpected error occurred. You can reset to return to the catalog.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-black font-extrabold text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors"
            >
              Reload Chitram
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
