/**
 * types.ts — Shared TypeScript types for @lkvip/cli
 */

export type ProjectId = 'hub' | 'game' | 'trade' | 'dating' | 'sports' | 'admin';
export type FrontendApp = 'hub' | 'game' | 'trade' | 'dating' | 'sports' | 'admin-dashboard';

export const ALL_PROJECTS: ProjectId[] = ['hub', 'game', 'trade', 'dating', 'sports', 'admin'];
export const ALL_FRONTEND_APPS: FrontendApp[] = ['hub', 'game', 'trade', 'dating', 'sports', 'admin-dashboard'];

export const APP_PORTS: Record<string, number> = {
  backend:          5000,
  hub:              5173,
  game:             5174,
  dating:           5176,
  trade:            5177,
  sports:           5178,
  'admin-dashboard': 5180,
};

export interface HealthCheck {
  name:     string;
  path:     string;
  optional?: boolean;
}

export interface HealthResult {
  name:    string;
  status:  'ok' | 'error' | 'warn';
  code?:   number;
  message: string;
  optional: boolean;
}

export interface EnvCheckResult {
  key:     string;
  status:  'ok' | 'missing' | 'warn';
  message: string;
}

export interface BuildResult {
  app:    FrontendApp;
  status: 'ok' | 'failed' | 'skipped';
  size?:  string;
}
