/**
 * build.ts — Build frontend apps
 *
 * Delegates to build-all.sh on Linux/macOS.
 * On Windows (dev machine) can also invoke npm run build directly via Node.
 *
 * Usage (via CLI):
 *   kjc build               # build all 6 frontends
 *   kjc build hub game      # build specific apps
 *   kjc build --ci          # fail fast on first error
 */

import path from 'path';
import fs   from 'fs';
import { Command } from 'commander';
import { log, ok, warn, die, header, info } from '../utils/logger';
import { runShellScript, runNode, FRONTEND_DIR } from '../utils/shell';
import { ALL_FRONTEND_APPS, type FrontendApp, type BuildResult } from '../types';

// ── Build a single frontend via npm run build (Node-native, cross-platform) ───

async function buildApp(app: FrontendApp): Promise<BuildResult> {
  const dir = path.join(FRONTEND_DIR, app);
  if (!fs.existsSync(dir)) {
    warn(`Directory not found: ${dir} — skipping ${app}`);
    return { app, status: 'skipped' };
  }

  log(`Building ${app}…`);
  try {
    await runNode('npm', ['ci', '--legacy-peer-deps', '--prefer-offline'], dir);
    await runNode('npm', ['run', 'build'], dir);

    const distDir = path.join(dir, 'dist');
    let size = '?';
    if (fs.existsSync(distDir)) {
      // Rough size estimate — sum of all file sizes in dist/
      const bytes = dirSize(distDir);
      size = formatBytes(bytes);
    }
    ok(`${app} → dist/ (${size})`);
    return { app, status: 'ok', size };
  } catch {
    warn(`${app} build FAILED`);
    return { app, status: 'failed' };
  }
}

function dirSize(dir: string): number {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += dirSize(full);
    } else {
      total += fs.statSync(full).size;
    }
  }
  return total;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}K`;
  return `${(bytes / 1024 / 1024).toFixed(1)}M`;
}

// ── Summary table ─────────────────────────────────────────────────────────────

function printSummary(results: BuildResult[]): void {
  console.log('\n' + '═'.repeat(55));
  console.log('  Build Summary');
  console.log('─'.repeat(55));
  console.log(`  ${'App'.padEnd(22)} ${'Status'.padEnd(10)} Dist Size`);
  console.log('─'.repeat(55));

  let anyFailed = false;
  for (const r of results) {
    const icon  = r.status === 'ok' ? '✅' : r.status === 'failed' ? '❌' : '⏭️ ';
    const size  = r.size ?? '-';
    console.log(`  ${icon} ${r.app.padEnd(20)} ${r.status.padEnd(10)} ${size}`);
    if (r.status === 'failed') anyFailed = true;
  }

  console.log('═'.repeat(55) + '\n');
  if (anyFailed) die('One or more builds failed.');
  else ok('All builds complete.');
}

// ── Commander sub-command ─────────────────────────────────────────────────────

export function registerBuildCommand(program: Command): void {
  program
    .command('build [apps...]')
    .description('Build frontend apps (defaults to all 6)')
    .option('--ci',      'Fail immediately on first build error')
    .option('--shell',   'Delegate to build-all.sh (Linux/macOS only)')
    .action(async (apps: string[], options: { ci?: boolean; shell?: boolean }) => {
      // ── Shell delegation mode ──────────────────────────────────────────────
      if (options.shell) {
        const args: string[] = [];
        if (options.ci) args.push('--ci');
        args.push(...apps);
        await runShellScript('build-all.sh', args);
        return;
      }

      // ── Node-native mode ───────────────────────────────────────────────────
      const targets = (apps.length > 0 ? apps : ALL_FRONTEND_APPS) as FrontendApp[];
      header('KJC Platform — Build All Frontends');
      info(`Target apps: ${targets.join(', ')}`);

      const results: BuildResult[] = [];
      for (const app of targets) {
        const result = await buildApp(app);
        results.push(result);
        if (result.status === 'failed' && options.ci) {
          die(`Build failed in CI mode — aborting (${app})`);
        }
      }

      printSummary(results);
    });
}
