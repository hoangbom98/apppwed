/**
 * backup.ts — MySQL backup for all 6 lkvip databases
 *
 * On Linux/macOS: delegates to backup-db.sh (uses mysqldump + gzip).
 * On Windows:    shows a helpful message.
 *
 * Usage (via CLI):
 *   lkvip backup
 *   lkvip backup --dir /tmp/backups --retention 7
 */

import { Command } from 'commander';
import { warn, log, header } from '../utils/logger';
import { runShellScript } from '../utils/shell';

// ── Commander sub-command ─────────────────────────────────────────────────────

export function registerBackupCommand(program: Command): void {
  program
    .command('backup')
    .description('MySQL backup for all 6 lkvip databases (delegates to backup-db.sh)')
    .option('--dir <path>',       'Backup directory (default: /var/backups/mysql)')
    .option('--retention <days>', 'Days to retain backups (default: 30)')
    .action(async (options: { dir?: string; retention?: string }) => {
      if (process.platform === 'win32') {
        header('LKVIP GROUP — Backup');
        warn('Backup must be run on the Linux VPS (requires mysqldump + bash).');
        log('SSH into your VPS and run:');
        log('  bash code/backend/scripts/backup-db.sh');
        process.exit(0);
      }

      // Pass env vars that backup-db.sh reads
      const env: Record<string, string> = { ...process.env as Record<string, string> };
      if (options.dir)       env['BACKUP_DIR']       = options.dir;
      if (options.retention) env['RETENTION_DAYS']   = options.retention;

      // execa respects the inherited env — set before calling
      if (options.dir)       process.env['BACKUP_DIR']       = options.dir;
      if (options.retention) process.env['RETENTION_DAYS']   = options.retention;

      await runShellScript('backup-db.sh');
    });
}
