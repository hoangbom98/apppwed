/**
 * @lkvip/constants — Entry point
 * Barrel re-export of all shared constants for the LKVIP platform.
 *
 * Usage:
 *   import { PROJECT_IDS, USER_ROLES, HTTP_STATUS, TransactionType } from '@lkvip/constants';
 */

export * from './projects';
export * from './roles';
export * from './assets';
export * from './errors';
export * from './currencies';
export * from './banks';

// ── Domain enums (single source of truth for all string literals) ──────────
export * from './enums';
