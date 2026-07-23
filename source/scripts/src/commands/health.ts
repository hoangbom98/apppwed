/**
 * health.ts — HTTP health check for all lkvip service endpoints
 *
 * TypeScript rewrite of health-check.js
 *
 * Usage (via CLI):
 *   lkvip health
 *   lkvip health --url http://localhost:5000
 *   lkvip health --timeout 3000
 */

import http  from 'http';
import https from 'https';
import { Command } from 'commander';
import { log, ok, warn, die, header } from '../utils/logger';
import type { HealthCheck, HealthResult } from '../types';

const CHECKS: HealthCheck[] = [
  { name: 'API Health',    path: '/health' },
  { name: 'Hub Module',    path: '/api/hub/health',     optional: true },
  { name: 'Game Module',   path: '/api/game/health',    optional: true },
  { name: 'Trade Module',  path: '/api/trade/health',   optional: true },
  { name: 'Dating Module', path: '/api/dating/health',  optional: true },
  { name: 'Sports Module', path: '/api/sports/health',  optional: true },
  { name: 'Admin Module',  path: '/api/admin/health',   optional: true },
  { name: 'Swagger Docs',  path: '/api/docs/',           optional: true },
];

// ── HTTP request helper ────────────────────────────────────────────────────────

function request(url: string, timeout: number): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), timeout);
    lib.get(url, (res) => {
      clearTimeout(timer);
      let body = '';
      res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    }).on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
}

// ── Core run logic (exported for programmatic use) ────────────────────────────

export async function runHealthCheck(baseUrl: string, timeout: number): Promise<boolean> {
  header(`Health Check — ${baseUrl}`);

  const results: HealthResult[] = [];
  let failed = 0;

  for (const check of CHECKS) {
    const url = `${baseUrl}${check.path}`;
    try {
      const { status, body } = await request(url, timeout);
      const isOk = status >= 200 && status < 400;

      let info = '';
      try {
        const j = JSON.parse(body) as Record<string, unknown>;
        if (typeof j.status === 'string') info = ` (${j.status})`;
      } catch { /* not JSON */ }

      if (isOk) {
        results.push({ name: check.name, status: 'ok', code: status, message: `HTTP ${status}${info}`, optional: !!check.optional });
        console.log(`  ✅  ${check.name.padEnd(20)} ${status}${info}`);
      } else {
        results.push({ name: check.name, status: 'error', code: status, message: `HTTP ${status}`, optional: !!check.optional });
        console.log(`  ❌  ${check.name.padEnd(20)} HTTP ${status}`);
        if (!check.optional) failed++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'UNKNOWN';
      if (check.optional) {
        results.push({ name: check.name, status: 'warn', message: msg, optional: true });
        console.log(`  ⚠️   ${check.name.padEnd(20)} ${msg} (optional)`);
      } else {
        results.push({ name: check.name, status: 'error', message: msg, optional: false });
        console.log(`  ❌  ${check.name.padEnd(20)} ${msg}`);
        failed++;
      }
    }
  }

  console.log('─'.repeat(50));
  if (failed === 0) {
    ok('All required checks passed.');
    return true;
  } else {
    console.log(`❌  ${failed} required check(s) failed.`);
    return false;
  }
}

// ── Commander sub-command ─────────────────────────────────────────────────────

export function registerHealthCommand(program: Command): void {
  program
    .command('health')
    .description('HTTP health check for all lkvip service endpoints')
    .option('--url <url>',     'Base API URL', process.env['APP_URL'] ?? 'http://localhost:5000')
    .option('--timeout <ms>',  'Request timeout in milliseconds', '5000')
    .action(async (options: { url: string; timeout: string }) => {
      const baseUrl = options.url;
      const timeout = parseInt(options.timeout, 10);
      log(`Target: ${baseUrl}  (timeout: ${timeout}ms)`);
      const passed = await runHealthCheck(baseUrl, timeout);
      process.exit(passed ? 0 : 1);
    });
}
