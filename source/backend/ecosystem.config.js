'use strict';
// PM2 Ecosystem — LKVIP GROUP Production
//
// Usage:
//   cd /var/www/lkvip/source/backend
//   pm2 start ecosystem.config.js --env production
//   pm2 reload lkvip-api --update-env   ← zero-downtime
//   pm2 save && pm2 startup              ← persist across reboots
//
// Monitor:
//   pm2 status | pm2 logs lkvip-api | pm2 monit

module.exports = {
  apps: [
    {
      name:      'lkvip-api',
      script:    'dist/server.js',   // built by: npm run build (tsc)
      cwd:       __dirname,

      instances:  'max',             // one worker per CPU core
      exec_mode:  'cluster',

      watch:              false,
      max_memory_restart: '400M',    // restart if RSS > 400MB per instance
      kill_timeout:       30000,     // 30s for graceful Socket.IO shutdown
      restart_delay:      3000,
      max_restarts:       10,
      min_uptime:         '10s',

      out_file:        '/var/log/pm2/lkvip-api-out.log',
      err_file:        '/var/log/pm2/lkvip-api-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs:      true,

      env_production: {
        NODE_ENV: 'production',
        PORT:     5000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT:     5000,
      },
    },
  ],
};
