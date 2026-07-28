/**
 * packages/ui/src/utils/sentry.ts
 * Lazy Sentry initializer — dùng chung cho tất cả frontend apps.
 * Không bundle @sentry/react nếu VITE_SENTRY_DSN rỗng (tree-shaken).
 */

interface SentryOptions {
  /** VITE_SENTRY_DSN — nếu rỗng/undefined thì không khởi tạo */
  dsn?: string;
  /** VITE_APP_ENV — 'production' | 'staging' | 'development' */
  env?: string;
  /** Tên app, dùng cho release tag, e.g. 'hub', 'game', 'trading' */
  app: string;
  /** Version từ package.json, optional */
  version?: string;
}

export function initSentry(options: SentryOptions): void {
  const { dsn, env = 'development', app, version } = options;

  // Không khởi tạo khi DSN rỗng (dev local hoặc CI)
  if (!dsn) return;

  // Dynamic import để không bundle khi DSN không có
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn,
      environment: env,
      release: version ? `${app}@${version}` : app,
      // Sampling: 10% traces ở production, 100% ở dev/staging
      tracesSampleRate: env === 'production' ? 0.1 : 1.0,
      // Replay: 10% sessions, 100% khi có error
      replaysSessionSampleRate: env === 'production' ? 0.1 : 0,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      // Ignore common noise
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        /^Network Error/,
        /^Request aborted/,
        /ChunkLoadError/,
      ],
    });
  }).catch(() => {
    // Silently fail if @sentry/react not installed
  });
}
