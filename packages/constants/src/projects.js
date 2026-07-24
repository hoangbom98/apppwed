'use strict';
/**
 * @lkvip/constants — projects.js
 * Project identifiers and frontend app configuration.
 *
 * Single source of truth for all project/app IDs used across:
 *   - projectResolver middleware
 *   - CLI build/deploy commands
 *   - Nginx config generation
 *   - @lkvip/types ProjectId type
 */

/** @type {string[]} All valid backend project IDs */
const PROJECT_IDS = ['hub', 'game', 'trade', 'dating', 'sports', 'admin'];

/** @type {string[]} All frontend app directory names */
const ALL_FRONTEND_APPS = [
  'hub',
  'game',
  'trade',
  'dating',
  'sports',
  'admin-dashboard',   // Note: admin dir is 'admin-dashboard', NOT 'admin'
];

/**
 * Dev server ports for each app.
 * @type {Record<string, number>}
 */
const APP_PORTS = {
  backend:            5000,
  hub:                5173,
  game:               5174,
  dating:             5176,
  trade:              5177,
  sports:             5178,
  'admin-dashboard':  5180,
};

/**
 * Backend route prefix → project ID mapping.
 * Mirrors projectResolver.js PATH_MAP.
 * @type {Record<string, string>}
 */
const ROUTE_PROJECT_MAP = {
  '/api/hub':    'hub',
  '/api/game':   'game',
  '/api/trade':  'trade',
  '/api/dating': 'dating',
  '/api/sports': 'sports',
  '/api/admin':  'admin',
  '/api/lkvip':  'game',  // LKvip uses game DB
};

module.exports = {
  PROJECT_IDS,
  ALL_FRONTEND_APPS,
  APP_PORTS,
  ROUTE_PROJECT_MAP,
};
