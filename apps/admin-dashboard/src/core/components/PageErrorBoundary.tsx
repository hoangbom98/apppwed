// Class-based ErrorBoundary for lazy-loaded route chunks.
// Catches chunk-load failures and renders a recovery UI instead of a white screen.
import React, { type ReactNode, type ErrorInfo } from 'react';

interface Props  { children: ReactNode; }
interface State  { hasError: boolean; }

export default class PageErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PageErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center px-6">
          <p className="text-gray-400 text-sm">Không thể tải trang. Kiểm tra kết nối và thử lại.</p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            Thử lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
