import fs from 'fs';
import path from 'path';

export class SecurityAnalyzer {
  async analyze(app: string) {
    const errors: any[] = [];
    const warnings: any[] = [];

    const appDir = app === 'backend' ? 'apps/backend' : `apps/${app}`;
    const appPath = path.join(process.cwd(), appDir);

    if (!fs.existsSync(appPath)) {
      return { errors, warnings };
    }

    // 1. Check for .env file
    const envPath = path.join(appPath, '.env');
    if (!fs.existsSync(envPath)) {
      warnings.push({
        message: `.env file missing in ${app}`,
        suggestion: 'Create .env from .env.example',
      });
    }

    // 2. Check for common hardcoded secrets (basic check)
    const files = this.getAllFiles(appPath);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('SECRET_KEY') || content.includes('API_KEY')) {
        warnings.push({
          message: `Potential hardcoded secret found in ${file}`,
          suggestion: 'Move secrets to environment variables',
        });
      }
    }

    return { errors, warnings };
  }

  private getAllFiles(dir: string): string[] {
    let files: string[] = [];
    if (!fs.existsSync(dir)) return files;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
        files.push(...this.getAllFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
    return files;
  }
}
