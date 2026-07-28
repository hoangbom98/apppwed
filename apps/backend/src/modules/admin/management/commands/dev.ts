/**
 * dev.ts — Start all development servers in parallel
 *
 * On Linux/macOS with tmux: delegates to dev-all.sh.
 * On Windows / --no-shell:  spawns npm run dev for each app via Node child processes.
 *
 * Usage (via CLI):
 *   lkvip dev
 *   lkvip dev --no-shell
 *   lkvip dev hub game
 *   lkvip dev --install
 */

import path from 'path';
import fs   from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { Command } from 'commander';
import { log, ok, warn, info, header } from '../utils/logger';
import { runShellScript, BACKEND_DIR, FRONTEND_DIR } from '../utils/shell';
import { APP_PORTS, type FrontendApp } from '../types';

const ALL_APPS: string[] = ['backend', 'hub', 'game', 'dating', 'trade', 'sports', 'admin-dashboard'];

// ── Get working directory for an app ─────────────────────────────────────────

function getDir(app: string): string {
  return app === 'backend' ? BACKEND_DIR : path.join(FRONTEND_DIR, app);
}

// ── Print dev URLs banner ─────────────────────────────────────────────────────

function printBanner(apps: string[]): void {
  console.log('\n' + '═'.repeat(55));
  console.log('  LKVIP GROUP — Dev Environment');
  console.log('═'.repeat(55));
  for (const app of apps) {
    const port = APP_PORTS[app] ?? '?';
    console.log(`  ${app.padEnd(20)} http://localhost:${port}`);
  }
  console.log('═'.repeat(55) + '\n');
}

// ── Background process mode (cross-platform) ──────────────────────────────────

function startBackground(apps: string[], doInstall: boolean): void {
  log('Launching as background processes…');

  const procs: ChildProcess[] = [];
  const colors = ['cyan', 'green', 'yellow', 'magenta', 'blue', 'red', 'white'];

  for (let i = 0; i < apps.length; i++) {
    const app = apps[i]!;
    const dir = getDir(app);

    if (!fs.existsSync(dir)) {
      warn(`Directory not found: ${dir} — skipping ${app}`);
      continue;
    }

    const port = APP_PORTS[app] ?? '?';
    ok(`${app} → http://localhost:${port}`);

    // Install if needed
    if (doInstall || !fs.existsSync(path.join(dir, 'node_modules'))) {
      log(`Installing deps for ${app}…`);
      const installCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      const install = spawn(installCmd, ['install', '--silent'], { cwd: dir, stdio: 'inherit' });
      // Fire and forget — dev starts immediately, install runs in background
      install.on('error', (e) => warn(`npm install error for ${app}: ${e.message}`));
    }

    const cmd  = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const prefix = `[${app}]`;

    const proc = spawn(cmd, ['run', 'dev'], { cwd: dir, stdio: 'pipe' });
    procs.push(proc);

    proc.stdout?.on('data', (data: Buffer) => {
      process.stdout.write(`${prefix} ${data.toString()}`);
    });
    proc.stderr?.on('data', (data: Buffer) => {
      process.stderr.write(`${prefix} ${data.toString()}`);
    });
    proc.on('error', (e) => warn(`${app} error: ${e.message}`));
  }

  if (procs.length === 0) {
    warn('No processes started.');
    return;
  }

  log(`Started ${procs.length} process(es). Press Ctrl+C to stop all.`);

  const cleanup = () => {
    log('Stopping all dev servers…');
    procs.forEach((p) => { try { p.kill(); } catch { /* already killed */ } });
    process.exit(0);
  };

  process.on('SIGINT',  cleanup);
  process.on('SIGTERM', cleanup);
}

// ── Commander sub-command ─────────────────────────────────────────────────────

export function registerDevCommand(program: Command): void {
  program
    .command('dev [apps...]')
    .description('Start all dev servers in parallel (defaults to all apps)')
    .option('--no-shell',   'Force Node.js background processes (skip dev-all.sh)')
    .option('--install',    'Run npm install before starting')
    .action(async (apps: string[], options: { shell: boolean; install?: boolean }) => {
      const targets = apps.length > 0 ? apps : ALL_APPS;
      const doInstall = !!options.install;

      // ── Shell delegation mode (Linux/macOS + tmux) ─────────────────────────
      if (options.shell && process.platform !== 'win32') {
        const args: string[] = [];
        if (doInstall) args.push('--install');
        await runShellScript('dev-all.sh', args);
        return;
      }

      // ── Node-native background mode ────────────────────────────────────────
      header('LKVIP GROUP — Dev');
      printBanner(targets);
      startBackground(targets, doInstall);
    });
}
