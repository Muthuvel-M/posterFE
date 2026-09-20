import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="w-16 h-16 rounded-3xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mb-4 shadow-lg shadow-amber-400/10">
            <AlertTriangle className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h2 className="text-lg font-black tracking-tight text-white mb-1">
            Something unexpected occurred
          </h2>
          <p className="text-xs text-zinc-400 max-w-sm mb-4">
            {this.state.error?.message || 'The screen encountered a temporary issue.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={this.handleReset}
              className="py-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Retry Screen</span>
            </button>
            {this.props.onNavigateHome && (
              <button
                onClick={this.props.onNavigateHome}
                className="py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center gap-1.5 border border-zinc-700 transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
