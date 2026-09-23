import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    // If the error is third-party extension noise like EmptyRanges, don't crash the UI
    const msg = error?.message || '';
    if (msg.includes('EmptyRanges') || msg.includes('cross-origin')) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const msg = error?.message || '';
    if (msg.includes('EmptyRanges') || msg.includes('cross-origin')) {
      return;
    }
    console.warn('[ErrorBoundary] Caught render error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF0F2] flex items-center justify-center p-4">
          <div className="bg-white border border-pink-200 rounded-3xl p-8 max-w-md w-full shadow-xl text-center space-y-4">
            <div className="w-14 h-14 bg-pink-50 border border-pink-200 rounded-2xl flex items-center justify-center mx-auto text-pink-600">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Something Went Wrong</h2>
              <p className="text-xs text-slate-500 mt-1">
                We encountered an unexpected issue while rendering this page.
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Storefront</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
