'use strict';

/**
 * PM2 Ecosystem — lkvip-api only
 * Launched from: /var/LKVIP/apps/backend
 *
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 reload lkvip-api --update-env
 *   pm2 save
 */
module.exports = {
  apps: [
    {
      name:               'lkvip-api',
      script:             'dist/server.js',
      cwd:                '/var/LKVIP/apps/backend',

      instances:          2,
      exec_mode:          'cluster',

      watch:              false,
      max_memory_restart: '700M',
      kill_timeout:       30000,
      restart_delay:      3000,
      max_restarts:       10,
      min_uptime:         '10s',

      node_args:          '--max-old-space-size=512',

      out_file:        '/var/LKVIP/data/logs/lkvip-api-out.log',
      err_file:        '/var/LKVIP/data/logs/lkvip-api-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs:      true,
      time:            true,

      env: {
        NODE_ENV: 'development',
        PORT:     5000,
      },

      env_production: {
        NODE_ENV:          'production',
        PORT:              5000,
        APP_URL:           'https://api.tc-gaming.live',
        UV_THREADPOOL_SIZE: '16',
        CORS_ORIGINS: [
          'https://tc-gaming.live',
          'https://www.tc-gaming.live',
          'https://hub.tc-gaming.live',
          'https://trade.tc-gaming.live',
          'https://sports.tc-gaming.live',
          'https://game.tc-gaming.live',
          'https://admin.tc-gaming.live',
          'https://banking.tc-gaming.live',
          'https://invest.tc-gaming.live',
          'https://store.tc-gaming.live',
          'https://lkvip.tc-gaming.live',
          'https://academy.tc-gaming.live',
          'https://landing.tc-gaming.live',
        ].join(','),
      },
    },
  ],
};
