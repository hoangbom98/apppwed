'use strict';
// PM2 Ecosystem — root convenience wrapper
// Canonical config: apps/backend/ecosystem.config.js
// Usage from repo root:
//   pm2 start ecosystem.config.js --env production
//   pm2 reload lkvip-api --update-env
module.exports = {
  apps: [
    {
      name:        'lkvip-api',
      script:      'apps/backend/dist/server.js',   // built by: pnpm run build (tsc)
      cwd:         '/var/LKVIP',
      instances:   'max',
      exec_mode:   'cluster',
      watch:       false,
      max_memory_restart: '400M',
      kill_timeout:  30000,
      restart_delay: 3000,
      max_restarts:  10,
      min_uptime:    '10s',
      err_file: '/var/LKVIP/logs/lkvip-api-err.log',
      out_file: '/var/LKVIP/logs/lkvip-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      env: {
        NODE_ENV: 'development',
        PORT:     5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT:     5000,
        APP_URL:  'https://api.tc-gaming.live',
        CORS_ORIGINS: 'https://tc-gaming.live,https://www.tc-gaming.live,https://hub.tc-gaming.live,https://trade.tc-gaming.live,https://sports.tc-gaming.live,https://admin.tc-gaming.live',
      },
    },
  ],
};
