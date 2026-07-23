// PM2 Ecosystem Configuration — Production VPS
// ─────────────────────────────────────────────────────────────────────────────
// Usage:
//   cd /var/www/website-admin/source/backend
//   pm2 start ecosystem.config.js --env production
//   pm2 save
//
// Reload (zero-downtime):
//   pm2 reload api-server --update-env
//
// Monitor:
//   pm2 status
//   pm2 logs api-server --lines 100
//   pm2 monit

'use strict';

const path = require('path');
// __dirname is the directory of this file — works both locally and on the VPS
// without hardcoding /var/www/website-admin.
const BASE = __dirname;

module.exports = {
  apps: [
    {
      // ── Identity ──────────────────────────────────────────────────────────
      name:        'api-server',
      script:      'server.js',
      cwd:         BASE,

      // ── Cluster mode — use all CPU cores ──────────────────────────────────
      instances:   'max',          // or a number, e.g. 2 for a 2-vCPU VPS
      exec_mode:   'cluster',

      // ── Process management ────────────────────────────────────────────────
      watch:              false,
      max_memory_restart: '400M',  // restart if RSS > 400MB per instance
      restart_delay:      3000,    // ms between restarts
      max_restarts:       10,
      min_uptime:         '10s',

      // ── Logging ───────────────────────────────────────────────────────────
      out_file:        '/var/log/pm2/api-server-out.log',
      err_file:        '/var/log/pm2/api-server-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time:            true,
      merge_logs:      true,       // combine cluster instance logs

      // ── Environment — production ──────────────────────────────────────────
      // Real secrets come from .env file loaded by dotenv in server.js.
      // Only override process-level vars here.
      env_production: {
        NODE_ENV: 'production',
        PORT:     5000,
      },

      // ── Environment — development (pm2 start ... --env development) ───────
      env_development: {
        NODE_ENV: 'development',
        PORT:     5000,
      },

      // ── Kill timeout (graceful shutdown) ──────────────────────────────────
      kill_timeout: 30000,          // ms to wait for server.close() before SIGKILL
    },
  ],
};
