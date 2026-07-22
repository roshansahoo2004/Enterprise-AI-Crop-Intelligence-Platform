import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[React Error Boundary Caught]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-card max-w-md p-8 border-red-500/20 bg-red-500/5 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
              <FiAlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-bold font-mono text-white">Something Went Wrong</h2>
            <p className="text-xs text-gray-400 font-mono leading-relaxed">
              An unhandled rendering error occurred in the application view. The system recovered safely without losing state.
            </p>

            <div className="p-3 bg-surface-900/80 rounded-xl border border-white/5 font-mono text-[10px] text-red-300 text-left overflow-x-auto max-h-24">
              {this.state.error?.toString() || 'Unknown React Exception'}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 btn-primary py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2"
              >
                <FiRefreshCw className="w-4 h-4" /> Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 bg-surface-800 text-gray-300 hover:text-white hover:bg-surface-700 border border-white/10 py-2.5 rounded-xl text-xs font-mono font-bold"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
