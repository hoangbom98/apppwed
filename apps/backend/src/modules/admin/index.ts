'use strict';
/**
 * Admin Module
 *
 * Provides the admin portal functionality:
 * - Auth (login, logout, token refresh — admin-only)
 * - Dashboard (system overview, stats)
 * - User management (all projects)
 * - Game configuration
 * - UI config management
 * - Announcements
 * - Transaction monitoring
 * - Risk & security management
 * - System settings
 * - Audit logs
 * - Auto-Ops background jobs
 */
const router = require('./routes/index');

module.exports = { router };
