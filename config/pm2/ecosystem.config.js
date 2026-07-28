'use strict';

/**
 * PM2 Ecosystem Config — LKVIP GROUP @ tc-gaming.live
 * 
 * Centralized PM2 configuration for all LKVIP services.
 * 
 * Deploy path : /var/LKVIP
 * Public API  : https://api.tc-gaming.live  (Nginx → :5000)
 * Internal    : 127.0.0.1:5000 only — NOT exposed to public directly
 *
 * Usage from repo root:
 *   pm2 start config/pm2/ecosystem.config.js --env production
 *   pm2 reload lkvip-api --update-env   ← zero-downtime
 */

module.exports = {
  apps: [
    {
      name:               'lkvip-api',
      script:             'apps/backend/dist/server.js',
      cwd:                '/var/LKVIP',
      instances:          'max',
      exec_mode:          'cluster',
      watch:              false,
      max_memory_restart: '400M',
      kill_timeout:       30000,
      restart_delay:      3000,
      max_restarts:       10,
      min_uptime:         '10s',
      
      // Centralized logs
      out_file:           '/var/LKVIP/data/logs/lkvip-api-out.log',
      err_file:           '/var/LKVIP/data/logs/lkvip-api-err.log',
      log_date_format:    'YYYY-MM-DD HH:mm:ss Z',
      merge_logs:         true,
      time:               true,

      env: {
        NODE_ENV: 'development',
        PORT:     5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT:     5000,
        APP_URL:  'https://api.tc-gaming.live',
        CORS_ORIGINS: 'https://tc-gaming.live,https://www.tc-gaming.live,https://hub.tc-gaming.live,https://trade.tc-gaming.live,https://sports.tc-gaming.live,https://game.tc-gaming.live,https://admin.tc-gaming.live',
      },
    },
  ],
};
