#!/usr/bin/env node
/**
 * cli.ts — @lkvip/cli entry point
 *
 * LKVIP GROUP management CLI built with Commander + TypeScript.
 *
 * Commands:
 *   lkvip health   — HTTP health check for all service endpoints
 *   lkvip env      — Validate required environment variables
 *   lkvip build    — Build frontend apps (all or specific)
 *   lkvip deploy   — Deploy to VPS (delegates to deploy.sh)
 *   lkvip backup   — MySQL backup (delegates to backup-db.sh)
 *   lkvip prisma   — Prisma schema utilities (standardize, generate, migrate, status)
 *   lkvip dev      — Start all dev servers in parallel
 *   lkvip logs     — Stream or view PM2 application logs
 *
 * Usage:
 *   npx ts-node code/backend/scripts/src/cli.ts <command> [options]   (dev)
 *   lkvip <command> [options]                                       (after npm link)
 */

import { Command } from 'commander';
import { registerHealthCommand  } from './commands/health';
import { registerEnvCommand     } from './commands/env';
import { registerBuildCommand   } from './commands/build';
import { registerDeployCommand  } from './commands/deploy';
import { registerBackupCommand  } from './commands/backup';
import { registerPrismaCommand  } from './commands/prisma';
import { registerDevCommand     } from './commands/dev';
import { registerLogsCommand    } from './commands/logs';

// ── Program definition ────────────────────────────────────────────────────────

const program = new Command();

program
  .name('lkvip')
  .description('LKVIP GROUP CLI — manage health, env, builds, deployments, and backups')
  .version('1.0.0', '-v, --version')
  .addHelpText('after', `
Examples:
  lkvip health                         # check all service endpoints
  lkvip env                            # validate .env variables
  lkvip env --file /path/to/.env       # validate a specific .env file
  lkvip build                          # build all 6 frontends
  lkvip build hub game                 # build only hub and game
  lkvip build --ci                     # fail fast on first error
  lkvip deploy                         # full VPS deploy (all modules)
  lkvip deploy --module backend        # deploy backend only
  lkvip deploy --module hub            # deploy hub frontend only
  lkvip deploy --rollback              # rollback to last known-good SHA
  lkvip backup                         # backup all 6 MySQL databases
  lkvip prisma standardize             # add @map() annotations to schemas
  lkvip prisma generate                # prisma generate (all schemas)
  lkvip prisma migrate                 # prisma migrate deploy (all schemas)
  lkvip prisma status                  # migration status (all schemas)
  lkvip dev                            # start all dev servers
  lkvip dev hub game                   # start only hub + game
  lkvip logs                           # stream PM2 logs (all instances)
  lkvip logs --lines 200               # show last 200 lines
  lkvip logs --err                     # error log only
  `);

// ── Register all sub-commands ─────────────────────────────────────────────────

registerHealthCommand(program);
registerEnvCommand(program);
registerBuildCommand(program);
registerDeployCommand(program);
registerBackupCommand(program);
registerPrismaCommand(program);
registerDevCommand(program);
registerLogsCommand(program);

// ── Parse ─────────────────────────────────────────────────────────────────────

program.parse(process.argv);

// If no command was given, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
