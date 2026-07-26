import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export class DependencyAnalyzer {
  async analyze(app: string) {
    const errors: any[] = [];
    const warnings: any[] = [];

    const appDir = app === 'backend' ? 'apps/backend' : `apps/${app}`;
    const pkgPath = path.join(process.cwd(), appDir, 'package.json');

    if (!fs.existsSync(pkgPath)) {
      return { errors, warnings };
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    // 1. Check for unstable versions
    for (const [name, version] of Object.entries(allDeps)) {
      if (typeof version === 'string' && (version.includes('*') || version.includes('latest'))) {
        warnings.push({
          message: `Dependency ${name} uses unstable version "${version}"`,
          suggestion: `Pin version to a specific version (e.g., "^1.0.0")`,
        });
      }
    }

    // 2. Check outdated
    try {
      // Run pnpm outdated --json
      const outdated = execSync(`pnpm --filter ${app === 'backend' ? 'lkvip-backend' : `@lkvip/${app}`} outdated --json`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      const data = JSON.parse(outdated);
      if (Object.keys(data).length > 0) {
        warnings.push({
          message: `${Object.keys(data).length} dependencies are outdated`,
          suggestion: 'Run `pnpm update` to update dependencies',
        });
      }
    } catch (e) {
      // pnpm outdated exits with code 1 if there are outdated packages
    }

    return { errors, warnings };
  }
}
