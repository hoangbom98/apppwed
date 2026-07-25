/**
 * @lkvip/constants — projects.ts
 * Project identifiers and frontend app configuration.
 *
 * Single source of truth for all project/app IDs used across:
 *   - projectResolver middleware
 *   - CLI build/deploy commands
 *   - Nginx config generation
 *   - @lkvip/types ProjectId type
 */

export type ProjectId = 'hub' | 'game' | 'trade' | 'dating' | 'sports' | 'admin';

/** All valid backend project IDs */
export const PROJECT_IDS: ProjectId[] = ['hub', 'game', 'trade', 'dating', 'sports', 'admin'];

/** All frontend app directory names */
export const ALL_FRONTEND_APPS: string[] = [
  'hub',
  'game',
  'trade',
  'dating',
  'sports',
  'admin-dashboard', // Note: admin dir is 'admin-dashboard', NOT 'admin'
];

/**
 * Dev server ports for each app.
 */
export const APP_PORTS: Record<string, number> = {
  backend:           5000,
  hub:               5173,
  game:              5174,
  dating:            5176,
  trade:             5177,
  sports:            5178,
  'admin-dashboard': 5180,
};

/**
 * Backend route prefix → project ID mapping.
 * Mirrors projectResolver PATH_MAP.
 */
export const ROUTE_PROJECT_MAP: Record<string, ProjectId> = {
  '/api/hub':    'hub',
  '/api/game':   'game',
  '/api/trade':  'trade',
  '/api/dating': 'dating',
  '/api/sports': 'sports',
  '/api/admin':  'admin',
  '/api/lkvip':  'game', // LKvip uses game DB
};

/**
 * Human-readable project labels.
 */
export const PROJECT_LABELS: Record<ProjectId, string> = {
  hub:     'LKVIP Hub',
  game:    'LKVIP Game',
  trade:   'LKVIP Trade',
  dating:  'LKVIP Dating',
  sports:  'LKVIP Sports',
  admin:   'LKVIP Admin',
};
