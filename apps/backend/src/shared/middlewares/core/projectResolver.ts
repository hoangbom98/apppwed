/**
 * Project Resolver Middleware
 * Determines which project/database to use based on:
 *  1. URL path prefix (/api/game → game)
 *  2. Hostname subdomain (game.example.com → game)
 *  3. X-Project header (for API clients)
 * Attaches: req.project, req.prisma
 *
 * Path→project map is sourced from @lkvip/constants (single source of truth).
 */
const { ROUTE_PROJECT_MAP, PROJECT_IDS } = require('@lkvip/constants');
const { getPrismaClient } = require('../../config/databases');

// Build a Set of valid project IDs for fast O(1) lookup
const VALID_PROJECTS = new Set(PROJECT_IDS);

// Build HOST_MAP from PROJECT_IDS (subdomain = project ID, except admin-dashboard)
const HOST_MAP = Object.fromEntries(PROJECT_IDS.map(p => [p, p]));

module.exports = (req, res, next) => {
  let project = 'hub'; // default

  // 1. Match by URL path prefix (most reliable in development)
  const matched = Object.keys(ROUTE_PROJECT_MAP).find(prefix => req.path.startsWith(prefix));
  if (matched) {
    project = ROUTE_PROJECT_MAP[matched];
  } else {
    // 2. Match by hostname subdomain
    const host = (req.get('host') || '').split('.')[0].toLowerCase();
    if (HOST_MAP[host]) project = HOST_MAP[host];

    // 3. Override with X-Project header if provided and valid
    const headerProject = req.get('X-Project');
    if (headerProject && VALID_PROJECTS.has(headerProject)) project = headerProject;
  }

  req.project = project;
  req.prisma  = getPrismaClient(project);
  next();
};
