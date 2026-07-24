/**
 * deploy.ts — Deploy the LKVIP GROUP (git pull → build → pm2 reload)
 *
 * On Linux/macOS: delegates to deploy.sh (full VPS deploy with rollback support).
 * On Windows:    shows a helpful message (VPS operations require Linux).
 *
 * Usage (via CLI):
 *   lkvip deploy
 *   lkvip deploy --module backend
 *   lkvip deploy --module hub --skip-build
 *   lkvip deploy --rollback
 *   lkvip deploy --branch develop
 */

import { Command } from 'commander';
import { log, warn, header } from '../utils/logger';
import { runShellScript } from '../utils/shell';

// ── Valid module names accepted by deploy.sh ──────────────────────────────────
type DeployModule = 'all' | 'backend' | 'hub' | 'game' | 'trade' | 'dating' | 'sports' | 'admin';

const VALID_MODULES: DeployModule[] = ['all', 'backend', 'hub', 'game', 'trade', 'dating', 'sports', 'admin'];

// ── Commander sub-command ─────────────────────────────────────────────────────

export function registerDeployCommand(program: Command): void {
  program
    .command('deploy')
    .description('Deploy the LKVIP GROUP to the VPS (delegates to deploy.sh)')
    .option('--module <name>',  `Module to deploy: ${VALID_MODULES.join(', ')}`, 'all')
    .option('--branch <name>',  'Git branch to pull', 'main')
    .option('--skip-build',     'Skip frontend npm build (use existing dist/)')
    .option('--rollback',       'Rollback to the last saved git SHA')
    .option('--auto-rollback',  'Automatically rollback if any step fails')
    .action(async (options: {
      module:       DeployModule;
      branch:       string;
      skipBuild?:   boolean;
      rollback?:    boolean;
      autoRollback?: boolean;
    }) => {
      if (!VALID_MODULES.includes(options.module)) {
        warn(`Unknown --module value: ${options.module}. Valid values: ${VALID_MODULES.join(', ')}`);
        process.exit(1);
      }

      if (process.platform === 'win32') {
        header('LKVIP GROUP — Deploy');
        warn('Deploy must be run on the Linux VPS (not Windows).');
        log('SSH into your VPS and run:');
        log('  bash source/scripts/deploy.sh --module=' + options.module);
        process.exit(0);
      }

      const args: string[] = [`--module=${options.module}`, `--branch=${options.branch}`];
      if (options.skipBuild)   args.push('--skip-build');
      if (options.rollback)    args.push('--rollback');
      if (options.autoRollback) args.push('--auto-rollback');

      await runShellScript('deploy.sh', args);
    });
}
