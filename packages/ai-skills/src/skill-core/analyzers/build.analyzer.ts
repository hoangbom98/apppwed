import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export class BuildAnalyzer {
  async analyze(app: string) {
    const errors: any[] = [];
    const warnings: any[] = [];

    const appDir = app === 'backend' ? 'apps/backend' : `apps/${app}`;
    const fullAppPath = path.join(process.cwd(), appDir);

    if (!fs.existsSync(fullAppPath)) {
      return { errors, warnings };
    }

    // Try building
    try {
      execSync(`pnpm --filter ${app === 'backend' ? 'lkvip-backend' : `@lkvip/${app}`} run build`, {
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 120000, // 2 mins timeout
      });
    } catch (e: any) {
      const output = e.stdout || e.stderr || e.message;
      errors.push({
        type: 'build',
        message: `Build failed for ${app}. Check logs.`,
        severity: 'error',
        fix: {
          description: `Rebuild ${app}`,
          command: `pnpm --filter ${app === 'backend' ? 'lkvip-backend' : `@lkvip/${app}`} run build`,
          autoFix: false,
        },
      });
    }

    // Check dist folder
    const distPath = path.join(fullAppPath, 'dist');
    if (!fs.existsSync(distPath) || fs.readdirSync(distPath).length === 0) {
      errors.push({
        type: 'build',
        message: 'Build output (dist/) is empty or missing',
        severity: 'error',
        fix: {
          description: 'Run build command',
          command: `pnpm --filter ${app === 'backend' ? 'lkvip-backend' : `@lkvip/${app}`} run build`,
          autoFix: true,
        },
      });
    }

    return { errors, warnings };
  }
}
