// @ts-nocheck
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; errorMessage: string; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-dark px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-danger/20 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-white mb-2">Đã xảy ra lỗi</h1>
          <p className="text-gray-400 text-sm mb-6 max-w-xs">
            Ứng dụng gặp sự cố không mong muốn. Vui lòng tải lại trang để tiếp tục.
          </p>
          {this.state.errorMessage && (
            <p className="text-[10px] text-gray-600 font-mono mb-4 max-w-xs truncate">{this.state.errorMessage}</p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-xl transition-colors"
          >
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
