'use strict';

/**
 * PM2 Ecosystem Config — LKVIP GROUP @ tc-gaming.live
 * ─────────────────────────────────────────────────────────────────────────────
 * VPS spec: 4 vCPU / 8 GB RAM / 160 GB SSD (DigitalOcean)
 *
 * Resource budget (RAM):
 *   MySQL     2.0 GB  (innodb_buffer_pool = 2G)
 *   Redis     1.0 GB  (maxmemory 1gb)
 *   lkvip-api 1.4 GB  (2 × 700 MB max_memory_restart)
 *   Nginx     0.2 GB
 *   OS/other  1.4 GB
 *   Swap      4.0 GB  (created by vps-setup.sh as safety net)
 *   ─────────────────────────────────────────────────────
 *   Total     ~6.0 GB used (leaves ~2 GB headroom)
 *
 * Why 2 instances (not 'max' = 4):
 *   4 instances × 700 MB = 2.8 GB → exceeds budget and leaves MySQL starved.
 *   2 instances × 700 MB = 1.4 GB → optimal for this VPS tier.
 *   Increase to 3 when RAM > 12 GB or CPU consistently > 70%.
 *
 * Deploy path : /var/LKVIP
 * Public API  : https://api.tc-gaming.live  (Nginx → :5000)
 * Internal    : 127.0.0.1:5000 only — KHÔNG expose trực tiếp ra ngoài
 *
 * Secrets: KHÔNG hard-code ở đây — luôn đọc từ apps/backend/.env
 *
 * Usage:
 *   pm2 start config/pm2/ecosystem.config.js --env production
 *   pm2 reload lkvip-api --update-env   ← zero-downtime reload
 *   pm2 save                             ← lưu process list để auto-start
 *
 * Scale up khi cần:
 *   pm2 scale lkvip-api 3               ← tăng lên 3 instances (nếu RAM > 12 GB)
 * ─────────────────────────────────────────────────────────────────────────────
 */

module.exports = {
  apps: [
    // ── LKVIP INVEST (invest.tc-gaming.live) — Next.js standalone :3011 ─────
    {
      name:               'lkvip-invest',
      script:             'apps/invest/start-invest.sh',
      interpreter:        'bash',
      cwd:                '/var/LKVIP',

      instances:          1,
      exec_mode:          'fork',

      watch:              false,
      max_memory_restart: '400M',
      kill_timeout:       10000,
      restart_delay:      3000,
      max_restarts:       10,
      min_uptime:         '10s',

      out_file:        '/var/LKVIP/data/logs/lkvip-invest-out.log',
      err_file:        '/var/LKVIP/data/logs/lkvip-invest-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs:      true,
      time:            true,

      env:            { NODE_ENV: 'development' },
      env_production: { NODE_ENV: 'production'  },
    },

    // ── LKVIP ACADEMY (academy.tc-gaming.live) — Next.js standalone :3013 ────
    {
      name:               'lkvip-academy',
      script:             'apps/academy/start-academy.sh',
      interpreter:        'bash',
      cwd:                '/var/LKVIP',

      instances:          1,
      exec_mode:          'fork',

      watch:              false,
      max_memory_restart: '400M',
      kill_timeout:       10000,
      restart_delay:      3000,
      max_restarts:       10,
      min_uptime:         '10s',

      out_file:        '/var/LKVIP/data/logs/lkvip-academy-out.log',
      err_file:        '/var/LKVIP/data/logs/lkvip-academy-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs:      true,
      time:            true,

      env:            { NODE_ENV: 'development' },
      env_production: { NODE_ENV: 'production'  },
    },

    // ── LKVIP STORE (store.tc-gaming.live) — Next.js standalone :3012 ───────
    {
      name:               'lkvip-store',
      script:             'apps/lkvip-store/start-store.sh',
      interpreter:        'bash',
      cwd:                '/var/LKVIP',

      instances:          1,
      exec_mode:          'fork',

      watch:              false,
      max_memory_restart: '400M',
      kill_timeout:       10000,
      restart_delay:      3000,
      max_restarts:       10,
      min_uptime:         '10s',

      out_file:        '/var/LKVIP/data/logs/lkvip-store-out.log',
      err_file:        '/var/LKVIP/data/logs/lkvip-store-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs:      true,
      time:            true,

      env:            { NODE_ENV: 'development' },
      env_production: { NODE_ENV: 'production'  },
    },

    // ── LKVIP GROUP PORTAL (lkvip.tc-gaming.live) — Next.js 15 standalone ────
    // Note: script is a bash wrapper to ensure PORT env is set before Node starts
    // See: apps/lkvipgroup-portal/start-portal.sh
    {
      name:               'lkvip-portal',
      script:             'apps/lkvipgroup-portal/start-portal.sh',
      interpreter:        'bash',
      cwd:                '/var/LKVIP',

      instances:          1,
      exec_mode:          'fork',

      watch:              false,
      max_memory_restart: '512M',
      kill_timeout:       10000,
      restart_delay:      3000,
      max_restarts:       10,
      min_uptime:         '10s',

      out_file:        '/var/LKVIP/data/logs/lkvip-portal-out.log',
      err_file:        '/var/LKVIP/data/logs/lkvip-portal-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs:      true,
      time:            true,

      // Env vars injected in start-portal.sh directly (PORT=3010, HOSTNAME, etc.)
      env:            { NODE_ENV: 'development' },
      env_production: { NODE_ENV: 'production'  },
    },

    {
      name:               'lkvip-api',
      // cwd phải là apps/backend để dotenv load đúng .env
      script:             'dist/server.js',
      cwd:                '/var/LKVIP/apps/backend',

      // ── Cluster mode — 2 instances tối ưu cho VPS 8 GB ───────────────────
      // 'max' (= 4 trên 4 vCPU) tiêu tốn 4 × 700 MB = 2.8 GB chỉ cho backend,
      // không đủ RAM cho MySQL buffer pool 2 GB. Dùng 2 để cân bằng.
      instances:          2,
      exec_mode:          'cluster',

      // ── Stability ─────────────────────────────────────────────────────────
      watch:              false,
      // 700 MB/instance → 2 instances = 1.4 GB tối đa cho backend
      max_memory_restart: '700M',
      kill_timeout:       30000,   // 30s graceful shutdown
      restart_delay:      3000,    // 3s delay giữa các lần restart
      max_restarts:       10,
      min_uptime:         '10s',

      // ── Node.js flags — tăng heap limit tối ưu cho 700M budget ───────────
      node_args:          '--max-old-space-size=512',

      // ── Logs (tập trung vào /var/LKVIP/data/logs/) ────────────────────────
      out_file:        '/var/LKVIP/data/logs/lkvip-api-out.log',
      err_file:        '/var/LKVIP/data/logs/lkvip-api-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs:      true,
      time:            true,

      // ── Environment: development ───────────────────────────────────────────
      env: {
        NODE_ENV: 'development',
        PORT:     5000,
        // Dev: 1 instance đủ để test
        instances: 1,
      },

      // ── Environment: production ────────────────────────────────────────────
      // Các biến nhạy cảm (JWT_SECRET, DB_URL…) KHÔNG đặt ở đây.
      // Chúng được đọc từ /var/LKVIP/apps/backend/.env khi PM2 khởi động.
      env_production: {
        NODE_ENV: 'production',
        PORT:     5000,
        APP_URL:  'https://api.tc-gaming.live',
        // UV_THREADPOOL_SIZE: tăng cho nhiều file I/O concurrent (backup, upload)
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
