/**
 * SentryErrorBoundary — wraps app root for Sentry error capture.
 * Only activates if VITE_SENTRY_DSN is set.
 * Falls back to plain React ErrorBoundary if @sentry/react not available.
 *
 * Usage in each SPA's main.tsx:
 *   import { AppErrorBoundary } from '@ui/components/SentryErrorBoundary';
 *   <AppErrorBoundary><App /></AppErrorBoundary>
 */
import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; }

// Try to use Sentry if available and DSN is configured
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SentryBoundary: (new (props: Props) => Component<Props, State>) | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Sentry = require('@sentry/react');
  // @ts-ignore
  if (import.meta.env?.VITE_SENTRY_DSN) {
    Sentry.init({
      // @ts-ignore
      dsn:              import.meta.env.VITE_SENTRY_DSN,
      // @ts-ignore
      environment:      import.meta.env.MODE,
      // @ts-ignore
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      integrations:     [Sentry.browserTracingIntegration()],
    });
    SentryBoundary = Sentry.ErrorBoundary;
  }
} catch { /* @sentry/react not installed — use plain boundary */ }

// ── Plain fallback error boundary ─────────────────────────────────────────────
class FallbackErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] Unhandled error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Public component ───────────────────────────────────────────────────────────
export function AppErrorBoundary({ children, fallback }: Props) {
  if (SentryBoundary) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const S = SentryBoundary as any;
    return <S fallback={fallback ?? <div>Something went wrong</div>}>{children}</S>;
  }
  return <FallbackErrorBoundary fallback={fallback}>{children}</FallbackErrorBoundary>;
}

export default AppErrorBoundary;
