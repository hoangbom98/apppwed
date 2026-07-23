// PM2 Ecosystem Config — root-level convenience wrapper
// ─────────────────────────────────────────────────────────────────────────────
// This file mirrors source/backend/ecosystem.config.js so PM2 can be started
// from the repository root:
//
//   pm2 start ecosystem.config.js --env production
//   pm2 save && pm2 startup
//
// The canonical production PM2 config lives at:
//   source/backend/ecosystem.config.js
//
// Backend is compiled TypeScript. Entry point after `npm run build`:
//   source/backend/dist/server.js
//
// Reload (zero-downtime):
//   pm2 reload api-server --update-env
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

module.exports = {
  apps: [
    {
      name:        'api-server',
      // Compiled output of server.ts  (run: cd source/backend && npm run build)
      script:      './source/backend/dist/server.js',
      cwd:         '.',
      instances:   process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode:   process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
      watch:       false,
      max_memory_restart: '400M',   // per instance
      restart_delay:      3000,
      max_restarts:       10,
      min_uptime:         '10s',
      kill_timeout:       30000,    // graceful shutdown for Socket.IO

      env: {
        NODE_ENV: 'development',
        PORT:     5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT:     5000,
      },

      out_file:        './logs/api-out.log',
      err_file:        './logs/api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs:      true,
      time:            true,
    },
  ],
};
