#!/usr/bin/env node
/**
 * cli.ts — @kjc/cli entry point
 *
 * KJC Platform management CLI built with Commander + TypeScript.
 *
 * Commands:
 *   kjc health   — HTTP health check for all service endpoints
 *   kjc env      — Validate required environment variables
 *   kjc build    — Build frontend apps (all or specific)
 *   kjc deploy   — Deploy to VPS (delegates to deploy.sh)
 *   kjc backup   — MySQL backup (delegates to backup-db.sh)
 *   kjc prisma   — Prisma schema utilities (standardize, generate, migrate, status)
 *   kjc dev      — Start all dev servers in parallel
 *
 * Usage:
 *   npx ts-node source/scripts/src/cli.ts <command> [options]   (dev)
 *   kjc <command> [options]                                       (after npm link)
 */

import { Command } from 'commander';
import { registerHealthCommand  } from './commands/health';
import { registerEnvCommand     } from './commands/env';
import { registerBuildCommand   } from './commands/build';
import { registerDeployCommand  } from './commands/deploy';
import { registerBackupCommand  } from './commands/backup';
import { registerPrismaCommand  } from './commands/prisma';
import { registerDevCommand     } from './commands/dev';

// ── Program definition ────────────────────────────────────────────────────────

const program = new Command();

program
  .name('kjc')
  .description('KJC Platform CLI — manage health, env, builds, deployments, and backups')
  .version('1.0.0', '-v, --version')
  .addHelpText('after', `
Examples:
  kjc health                         # check all service endpoints
  kjc env                            # validate .env variables
  kjc env --file /path/to/.env       # validate a specific .env file
  kjc build                          # build all 6 frontends
  kjc build hub game                 # build only hub and game
  kjc build --ci                     # fail fast on first error
  kjc deploy                         # full VPS deploy (all modules)
  kjc deploy --module backend        # deploy backend only
  kjc deploy --module hub            # deploy hub frontend only
  kjc deploy --rollback              # rollback to last known-good SHA
  kjc backup                         # backup all 6 MySQL databases
  kjc prisma standardize             # add @map() annotations to schemas
  kjc prisma generate                # prisma generate (all schemas)
  kjc prisma migrate                 # prisma migrate deploy (all schemas)
  kjc prisma status                  # migration status (all schemas)
  kjc dev                            # start all dev servers
  kjc dev hub game                   # start only hub + game
  `);

// ── Register all sub-commands ─────────────────────────────────────────────────

registerHealthCommand(program);
registerEnvCommand(program);
registerBuildCommand(program);
registerDeployCommand(program);
registerBackupCommand(program);
registerPrismaCommand(program);
registerDevCommand(program);

// ── Parse ─────────────────────────────────────────────────────────────────────

program.parse(process.argv);

// If no command was given, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
