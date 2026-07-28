module.exports = {
  apps: [
    {
      name: 'lkvip-api',
      script: 'apps/backend/server.ts',
      interpreter: 'ts-node',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      watch: false,
      max_memory_restart: '1G',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
    },
  ],
};
