'use strict';
// PM2 Ecosystem — LKVIP GROUP @ tc-gaming.live
//
// Deploy path : /var/LKVIP
// Public API  : https://api.tc-gaming.live  (Nginx → :5000)
// Internal    : 127.0.0.1:5000 only — NOT exposed to public directly
//
// Port isolation:
//   This project occupies only port 5000 on localhost.
//   Nginx is the only public-facing listener (80/443).
//   If other projects share the same VPS, use a different PORT (e.g. 5001)
//   and update /var/LKVIP/config/nginx/tc-gaming.conf upstream accordingly.
//
// Usage:
//   cd /var/LKVIP
//   pm2 start apps/backend/ecosystem.config.js --env production
//   pm2 reload lkvip-api --update-env   ← zero-downtime
//   pm2 save && pm2 startup              ← persist across reboots
//
// Monitor:
//   pm2 status | pm2 logs lkvip-api | pm2 monit

module.exports = {
  apps: [
    {
      name:      'lkvip-api',
      script:    'dist/server.js',   // built by: pnpm run build (tsc)
      cwd:       __dirname,

      instances:  'max',             // one worker per CPU core
      exec_mode:  'cluster',

      watch:              false,
      max_memory_restart: '400M',    // restart if RSS > 400MB per instance
      kill_timeout:       30000,     // 30s for graceful Socket.IO shutdown
      restart_delay:      3000,
      max_restarts:       10,
      min_uptime:         '10s',

      // Logs — isolated to this project's directory
      out_file:        '/var/LKVIP/logs/lkvip-api-out.log',
      err_file:        '/var/LKVIP/logs/lkvip-api-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs:      true,

      env_production: {
        NODE_ENV: 'production',
        PORT:     5000,              // ← internal only; change if port conflict
        APP_URL:  'https://api.tc-gaming.live',
        CORS_ORIGINS: 'https://tc-gaming.live,https://www.tc-gaming.live,https://hub.tc-gaming.live,https://trade.tc-gaming.live,https://sports.tc-gaming.live,https://admin.tc-gaming.live',
      },
      env_development: {
        NODE_ENV: 'development',
        PORT:     5000,
      },
    },
  ],
};
