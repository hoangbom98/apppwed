/**
 * @lkvip/constants — ESM entry point (src/index.mjs)
 * Re-exports all constants for Vite-bundled frontends.
 *
 * Usage (frontend, TypeScript, Vite):
 *   import { PROJECT_IDS, USER_ROLES } from '@lkvip/constants';
 *
 * Usage (backend, CommonJS):
 *   const { PROJECT_IDS } = require('@lkvip/constants');
 */

// ESM re-export via createRequire for Node.js / Vite compatibility
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const constants = require('./index.js');

export const {
  // ── Projects ───────────────────────────────────────────────────
  PROJECT_IDS,
  ALL_FRONTEND_APPS,
  APP_PORTS,
  ROUTE_PROJECT_MAP,
  PROJECT_LABELS,

  // ── Roles ──────────────────────────────────────────────────────
  USER_ROLES,
  ADMIN_ROLES,
  ELEVATED_ROLES,
  ROLE_LEVEL,
  isAdminRole,
  roleAtLeast,

  // ── Errors ─────────────────────────────────────────────────────
  HTTP_STATUS,
  ERROR_CODES,

  // ── Currencies ─────────────────────────────────────────────────
  CURRENCIES,
  PAYMENT_GATEWAYS,
} = constants;

export default constants;
