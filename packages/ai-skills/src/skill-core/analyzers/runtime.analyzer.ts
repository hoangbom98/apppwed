import axios from 'axios';

export class RuntimeAnalyzer {
  async analyze(app: string) {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Map app to port (based on common LKVIP setup)
    // Only backend is a running service; others are static web apps (served by Nginx)
    const ports: Record<string, number> = {
      backend: 5000,
    };

    const port = ports[app];
    if (!port) {
      return { errors, warnings };
    }

    const baseUrl = `http://localhost:${port}`;

    // Check health
    try {
      const res = await axios.get(`${baseUrl}/health`, { timeout: 3000 });
      if (res.status !== 200) {
        errors.push({
          type: 'runtime',
          message: `${app} health check failed: HTTP ${res.status}`,
          severity: 'error',
          fix: {
            description: `Restart ${app} service`,
            command: `pm2 restart lkvip-api`, // Correct PM2 name
            autoFix: true,
          },
        });
      }
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED') {
        errors.push({
          type: 'runtime',
          message: `${app} is not running`,
          severity: 'error',
          fix: {
            description: `Start ${app} service`,
            command: `pm2 start apps/backend/ecosystem.config.js --env production`,
            autoFix: true,
          },
        });
      } else {
        errors.push({
          type: 'runtime',
          message: `${app} health check failed: ${e.message}`,
          severity: 'error',
        });
      }
    }

    return { errors, warnings };
  }
}
