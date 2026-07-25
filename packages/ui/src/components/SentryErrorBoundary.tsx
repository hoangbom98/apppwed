// packages/shared-ui/src/components/SentryErrorBoundary.tsx
import React from 'react';

interface Props { children: React.ReactNode; fallback?: React.ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class SentryErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Forward to Sentry if available
    try {
      const Sentry = (window as any).__Sentry__;
      if (Sentry) Sentry.captureException(error, { extra: info });
    } catch { /* noop */ }
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{ padding: 32, textAlign: 'center', color: '#ff4d4f' }}>
          <h3>Đã xảy ra lỗi</h3>
          <p style={{ color: '#8892b0', fontSize: 12 }}>{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
