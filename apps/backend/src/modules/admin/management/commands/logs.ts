/**
 * logs.ts — View PM2 and application logs
 *
 * Usage (via CLI):
 *   lkvip logs                     # stream api-server logs (all instances)
 *   lkvip logs --lines 200          # show last 200 lines
 *   lkvip logs --err                # show error log only
 *   lkvip logs --out                # show stdout log only
 *   lkvip logs --no-stream          # print snapshot and exit (no tail)
 */
import { Command } from 'commander';
import { log, ok, warn, info, die, step } from '../utils/logger';
import { runShellScript, BACKEND_DIR } from '../utils/shell';
// execa v8+ is ESM-only; use the CJS-compatible import pattern for CommonJS builds.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const execa = require('execa').execa ?? require('execa');
import * as path from 'path';
import * as fs from 'fs';

interface LogsOptions {
  lines: string;
  err: boolean;
  out: boolean;
  noStream: boolean;
}

const PM2_OUT_LOG = '/var/log/pm2/lkvip-api-out.log';
const PM2_ERR_LOG = '/var/log/pm2/lkvip-api-err.log';

export function registerLogsCommand(program: Command): void {
  program
    .command('logs')
    .description('Stream or view PM2 application logs')
    .option('--lines <n>',  'Number of lines to show from history', '100')
    .option('--err',        'Show error log only')
    .option('--out',        'Show stdout log only')
    .option('--no-stream',  'Print snapshot and exit (do not tail)')
    .action(async (opts: LogsOptions) => {
      const lines = parseInt(opts.lines, 10) || 100;

      // On Linux/macOS — delegate to PM2
      if (process.platform !== 'win32') {
        const pm2Args = ['logs', 'lkvip-api', '--lines', String(lines)];

        if (opts.err) {
          pm2Args.push('--err');
        } else if (opts.out) {
          pm2Args.push('--out');
        }

        if (opts.noStream) {
          pm2Args.push('--nostream');
        }

        log(`PM2 logs — api-server (last ${lines} lines)`);
        info('Press Ctrl+C to stop streaming\n');

        try {
          const child = execa('pm2', pm2Args, { stdio: 'inherit' });
          await child;
        } catch (err: unknown) {
          // User pressed Ctrl+C — normal exit
          const anyErr = err as (Error & { signal?: string });
          if (anyErr.signal === 'SIGINT') {
            process.exit(0);
          }
          die(`Failed to run pm2 logs: ${(err as Error).message}`);
        }
        return;
      }

      // On Windows — read log files directly if they exist
      warn('PM2 is not available on Windows. Reading log files directly...');

      const logFiles: string[] = [];
      if (!opts.err) logFiles.push(PM2_OUT_LOG);
      if (!opts.out)  logFiles.push(PM2_ERR_LOG);

      for (const logFile of logFiles) {
        const label = path.basename(logFile);
        if (!fs.existsSync(logFile)) {
          warn(`Log file not found: ${logFile}`);
          continue;
        }
        log(`── ${label} ──`);
        try {
          const content = fs.readFileSync(logFile, 'utf8');
          const logLines = content.split('\n');
          const tail = logLines.slice(-lines).join('\n');
          process.stdout.write(tail + '\n');
        } catch (e) {
          warn(`Could not read ${logFile}: ${(e as Error).message}`);
        }
      }
    });
}
