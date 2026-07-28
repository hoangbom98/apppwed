import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export class TypeScriptAnalyzer {
  async analyze(app: string) {
    const errors: any[] = [];
    const warnings: any[] = [];

    const appDir = app === 'backend' ? 'apps/backend' : `apps/${app}`;
    const fullAppPath = path.join(process.cwd(), appDir);

    if (!fs.existsSync(fullAppPath)) {
      return { errors, warnings };
    }

    try {
      // Run tsc --noEmit and capture output
      // We use --pretty false to make parsing easier
      const output = execSync(`pnpm --filter ${app === 'backend' ? 'lkvip-backend' : `@lkvip/${app}`} run typecheck`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      // If it passes, no errors
    } catch (e: any) {
      const output = e.stdout || e.stderr || e.message;
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.includes('error TS')) {
          const match = line.match(/(\S+):(\d+):(\d+) - error TS(\d+): (.+)/);
          if (match) {
            const [, file, lineNum, col, code, message] = match;
            errors.push({
              type: 'ts',
              file,
              message: `TS${code}: ${message} (${file}:${lineNum})`,
              severity: 'error',
              fix: this.getFixForTypeScriptError(code, message, file, app),
            });
          } else {
             // Fallback for different format
             errors.push({
               type: 'ts',
               message: line.trim(),
               severity: 'error',
             });
          }
        }
      }
    }

    // Check tsconfig.json
    const tsconfigPath = path.join(fullAppPath, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
        if (config.compilerOptions && config.compilerOptions.strict !== true) {
          warnings.push({
            message: 'Strict mode not enabled in tsconfig.json',
            suggestion: 'Enable "strict": true in compilerOptions for better type safety',
          });
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    return { errors, warnings };
  }

  private getFixForTypeScriptError(code: string, message: string, file: string, app: string) {
    const filter = app === 'backend' ? 'lkvip-backend' : `@lkvip/${app}`;

    if (code === '2307' && message.includes('Cannot find module')) {
      const pkg = message.match(/['"]([^'"]+)['"]/)?.[1];
      if (pkg && !pkg.startsWith('.') && !pkg.startsWith('@/')) {
        return {
          description: `Install missing module: ${pkg}`,
          command: `pnpm add -D ${pkg} --filter ${filter}`,
          autoFix: true,
        };
      }
    }

    return null;
  }
}
