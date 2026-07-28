// PM2 Ecosystem Config — root-level convenience wrapper
// ─────────────────────────────────────────────────────────────────────────────
// Domain  : tc-gaming.live
// Deploy  : /var/LKVIP  (isolated — do NOT change cwd to a shared path)
// Port    : 5000 (127.0.0.1 only — Nginx proxies public traffic)
//
// Start from repo root:
//   pm2 start config/pm2/ecosystem.config.js --env production
//   pm2 save && pm2 startup
//
// The canonical production PM2 config lives at:
//   apps/backend/ecosystem.config.js
//
// Backend entry point after `pnpm run build`:
//   apps/backend/dist/server.js
//
// Reload (zero-downtime):
//   pm2 reload lkvip-api --update-env
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

module.exports = {
  apps: [
    {
      name:        'lkvip-api',
      // Compiled output of server.ts  (run: pnpm --filter lkvip-backend run build)
      script:      './apps/backend/dist/server.js',
      cwd:         '/var/LKVIP',      // ← always absolute; isolated from other projects
      instances:   process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode:   process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
      watch:       false,
      max_memory_restart: '400M',     // per instance
      restart_delay:      3000,
      max_restarts:       10,
      min_uptime:         '10s',
      kill_timeout:       30000,      // graceful shutdown for Socket.IO

      env: {
        NODE_ENV: 'development',
        PORT:     5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT:     5000,               // ← internal only — Nginx → 127.0.0.1:5000
        APP_URL:  'https://api.tc-gaming.live',
        CORS_ORIGINS: 'https://tc-gaming.live,https://www.tc-gaming.live,https://hub.tc-gaming.live,https://trade.tc-gaming.live,https://sports.tc-gaming.live,https://game.tc-gaming.live,https://admin.tc-gaming.live',
      },

      // Logs stored inside this project's directory only
      out_file:        '/var/LKVIP/logs/lkvip-api-out.log',
      err_file:        '/var/LKVIP/logs/lkvip-api-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs:      true,
      time:            true,
    },
  ],
};
