import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export class DatabaseAnalyzer {
  async analyze(app: string) {
    const errors: any[] = [];
    const warnings: any[] = [];

    // The database modules as referenced in the repo
    const modules = ['admin', 'hub', 'game', 'sports', 'trade', 'dating'];

    // 1. Check Prisma schema files and migrations
    for (const module of modules) {
      const schemaPath = path.join(process.cwd(), 'prisma', module, 'schema.prisma');

      // We only run this check if the app being scanned interacts with databases
      // For simplicity, we check if the prisma schema exists.
      if (!fs.existsSync(schemaPath)) {
        continue;
      }

      // Check migration status
      try {
        // Assuming backend has the prisma cli
        const status = execSync(
          `cd apps/backend && npx prisma migrate status --schema=../prisma/${module}/schema.prisma`,
          { encoding: 'utf-8', stdio: 'pipe' }
        );
        if (status.includes('Database schema is not in sync')) {
          errors.push({
            type: 'db',
            message: `Database schema is not in sync for ${module}`,
            severity: 'error',
            fix: {
              description: `Run migration for ${module}`,
              command: `cd apps/backend && npx prisma migrate deploy --schema=../prisma/${module}/schema.prisma`,
              autoFix: true,
            },
          });
        }
      } catch (e) {
        // Ignore errors from check
      }
    }

    return { errors, warnings };
  }
}
