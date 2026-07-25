#!/usr/bin/env tsx
/**
 * scripts/daily-report.ts
 *
 * Daily System Health Report Orchestrator
 *
 * Runs all automated checks in sequence and produces a combined report:
 *   1. Backend API route audit (check-api)
 *   2. Frontend route scan (check-routes)
 *   3. Service health check (health-check)
 *   4. Backend unit tests (jest)
 *   5. TypeScript compile check (tsc --noEmit)
 *
 * Output formats:
 *   - Human-readable console report
 *   - JSON file saved to reports/YYYY-MM-DD.json
 *   - Telegram alert if critical issues found
 *
 * Usage:
 *   tsx scripts/daily-report.ts
 *   tsx scripts/daily-report.ts --env production
 *   tsx scripts/daily-report.ts --no-tests       (skip jest run)
 *   tsx scripts/daily-report.ts --no-telegram    (skip alerts)
 *
 * Schedule via cron (daily at 7am):
 *   0 7 * * * cd /var/LKVIP && tsx scripts/daily-report.ts --env production >> logs/daily.log 2>&1
 */

import { execSync, spawnSync }  from 'child_process';
import fs   from 'fs';
import path from 'path';
import https from 'https';

// ── Config ────────────────────────────────────────────────────────────────────

const ROOT       = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(ROOT, 'reports');
const SCRIPTS    = path.join(ROOT, 'scripts');

const args        = process.argv.slice(2);
const ENV         = args.find((_, i) => args[i - 1] === '--env') ?? 'local';
const NO_TESTS    = args.includes('--no-tests');
const NO_TELEGRAM = args.includes('--no-telegram');
const DATE_STR    = new Date().toISOString().split('T')[0];

// Load .env
const envFile = path.join(ROOT, 'apps/backend/.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type CheckStatus = 'pass' | 'warn' | 'fail' | 'skip';

interface CheckResult {
  name:     string;
  status:   CheckStatus;
  summary:  string;
  detail?:  string;          // raw stdout/stderr snippet
  durationMs: number;
}

// ── Runner helpers ─────────────────────────────────────────────────────────────

function runCheck(
  name: string,
  cmd: string,
  opts: { cwd?: string; timeout?: number } = {}
): CheckResult {
  const start = Date.now();
  const result = spawnSync('sh', ['-c', cmd], {
    cwd:      opts.cwd ?? ROOT,
    timeout:  opts.timeout ?? 90_000,
    encoding: 'utf-8',
    env:      { ...process.env, FORCE_COLOR: '0' },
  });

  const ms      = Date.now() - start;
  const stdout  = (result.stdout ?? '').trim();
  const stderr  = (result.stderr ?? '').trim();
  const success = result.status === 0 && !result.error;
  const output  = [stdout, stderr].filter(Boolean).join('\n').slice(0, 800);

  return {
    name,
    status:     success ? 'pass' : 'fail',
    summary:    success ? 'Passed' : `Exit code ${result.status ?? 'TIMEOUT'}`,
    detail:     output || undefined,
    durationMs: ms,
  };
}

function runJsonCheck<T>(
  name: string,
  cmd: string,
  parse: (out: string) => { status: CheckStatus; summary: string; raw: T },
  opts: { cwd?: string; timeout?: number } = {}
): CheckResult & { data?: T } {
  const start = Date.now();
  const result = spawnSync('sh', ['-c', cmd], {
    cwd:      opts.cwd ?? ROOT,
    timeout:  opts.timeout ?? 60_000,
    encoding: 'utf-8',
    env:      { ...process.env, FORCE_COLOR: '0' },
  });

  const ms    = Date.now() - start;
  const stdout = (result.stdout ?? '').trim();

  try {
    const parsed = parse(stdout);
    return { name, ...parsed, durationMs: ms };
  } catch {
    return {
      name,
      status:  result.status === 0 ? 'warn' : 'fail',
      summary: `Could not parse output`,
      detail:  stdout.slice(0, 400),
      durationMs: ms,
    };
  }
}

// ── Checks ─────────────────────────────────────────────────────────────────────

async function runAllChecks(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // ── 1. TypeScript compile check ──────────────────────────────────────────
  console.log('⏳ [1/5] TypeScript type check...');
  results.push(runCheck(
    'TypeScript',
    'npx tsc --noEmit 2>&1 | head -20',
    { cwd: path.join(ROOT, 'apps/backend'), timeout: 60_000 }
  ));

  // ── 2. Backend unit tests ─────────────────────────────────────────────────
  if (NO_TESTS) {
    results.push({ name: 'Unit Tests', status: 'skip', summary: 'Skipped (--no-tests)', durationMs: 0 });
  } else {
    console.log('⏳ [2/5] Unit tests...');
    const testResult = runCheck(
      'Unit Tests',
      'npm test -- --passWithNoTests 2>&1 | tail -15',
      { cwd: path.join(ROOT, 'apps/backend'), timeout: 120_000 }
    );
    // Detect test count from output
    const testMatch = testResult.detail?.match(/Tests:\s+(\d+)\s+passed.*?(\d+)\s+total/);
    if (testMatch) {
      testResult.summary = `${testMatch[1]} / ${testMatch[2]} tests passed`;
    }
    results.push(testResult);
  }

  // ── 3. Backend API route audit ────────────────────────────────────────────
  console.log('⏳ [3/5] API route audit...');
  const apiResult = runJsonCheck(
    'API Routes',
    `tsx ${SCRIPTS}/check-api.ts --json --no-fetch`,
    (out) => {
      const json = JSON.parse(out) as { totalRoutes: number; modules: Array<{ module: string; routeCount: number; hasCoverage: boolean }> };
      const uncovered = json.modules.filter(m => !m.hasCoverage).map(m => m.module);
      return {
        status:  uncovered.length > 3 ? 'warn' : 'pass',
        summary: `${json.totalRoutes} routes across ${json.modules.length} modules; ${uncovered.length} modules without tests`,
        raw:     json,
      };
    }
  );
  results.push(apiResult);

  // ── 4. Frontend route scan ────────────────────────────────────────────────
  console.log('⏳ [4/5] Frontend routes...');
  const routeResult = runJsonCheck(
    'Frontend Routes',
    `tsx ${SCRIPTS}/check-routes.ts --json --no-fetch`,
    (out) => {
      const json = JSON.parse(out) as { reports: Array<{ app: string; routes: string[]; summary: { total: number } }> };
      const total = json.reports.reduce((s, r) => s + r.summary.total, 0);
      return {
        status:  'pass',
        summary: `${total} routes across ${json.reports.length} apps`,
        raw:     json,
      };
    }
  );
  results.push(routeResult);

  // ── 5. Health check ───────────────────────────────────────────────────────
  console.log('⏳ [5/5] Service health...');
  const healthResult = runJsonCheck(
    'Service Health',
    `tsx ${SCRIPTS}/health-check.ts --json${ENV === 'production' ? ' --env production' : ''}`,
    (out) => {
      const json = JSON.parse(out) as { services: Array<{ name: string; status: string; ms: number }> };
      const down     = json.services.filter(s => s.status === 'down').map(s => s.name);
      const degraded = json.services.filter(s => s.status === 'degraded').map(s => s.name);
      const offline  = json.services.filter(s => s.status === 'offline').map(s => s.name);
      const running  = json.services.filter(s => s.status === 'healthy');

      let status: CheckStatus = 'pass';
      let summary = `${running.length} / ${json.services.length} services healthy`;

      if (down.length)     { status = 'fail'; summary += `; DOWN: ${down.join(', ')}`; }
      if (degraded.length) { status = 'warn'; summary += `; degraded: ${degraded.join(', ')}`; }
      if (offline.length && running.length === 0) { status = 'warn'; summary = 'All services offline (dev server not running)'; }

      return { status, summary, raw: json };
    }
  );
  results.push(healthResult);

  return results;
}

// ── Telegram alert ─────────────────────────────────────────────────────────────

async function sendTelegram(text: string): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId || NO_TELEGRAM) return;

  const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' });

  await new Promise<void>(resolve => {
    const req = https.request(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => { res.resume(); resolve(); });
    req.on('error', () => resolve());
    req.write(body);
    req.end();
  });
}

// ── Report output ──────────────────────────────────────────────────────────────

const STATUS_ICON: Record<CheckStatus, string> = {
  pass: '✅',
  warn: '⚠️ ',
  fail: '❌',
  skip: '⏭️ ',
};

function printReport(results: CheckResult[], totalMs: number): void {
  const border = '═'.repeat(65);
  console.log(`\n${border}`);
  console.log(`📋 LKVIP DAILY REPORT — ${DATE_STR}  [${ENV}]`);
  console.log(border);

  for (const r of results) {
    const icon  = STATUS_ICON[r.status];
    const time  = `${(r.durationMs / 1000).toFixed(1)}s`;
    console.log(`\n${icon} ${r.name.padEnd(22)} ${r.summary}`);
    console.log(`   Duration: ${time}`);
    if (r.status !== 'pass' && r.detail) {
      const lines = r.detail.split('\n').slice(0, 6);
      for (const l of lines) console.log(`   ${l}`);
    }
  }

  const pass = results.filter(r => r.status === 'pass').length;
  const fail = results.filter(r => r.status === 'fail').length;
  const warn = results.filter(r => r.status === 'warn').length;

  console.log(`\n${border}`);
  console.log(`📊 ${pass} passed  /  ${warn} warnings  /  ${fail} failed     Total: ${(totalMs / 1000).toFixed(1)}s`);
  console.log(border);
}

function buildTelegramMessage(results: CheckResult[]): string {
  const lines = [
    `📋 *LKVIP Daily Report* — ${DATE_STR} \`[${ENV}]\`\n`,
  ];

  for (const r of results) {
    const icon = STATUS_ICON[r.status].replace(' ', '');
    lines.push(`${icon} *${r.name}*: ${r.summary}`);
  }

  const fail = results.filter(r => r.status === 'fail').length;
  const warn = results.filter(r => r.status === 'warn').length;

  if (fail) {
    lines.push(`\n🚨 *${fail} check(s) FAILED — immediate attention required*`);
  } else if (warn) {
    lines.push(`\n⚠️  *${warn} warning(s) detected*`);
  } else {
    lines.push('\n✅ All checks passed!');
  }

  return lines.join('\n');
}

// ── Persist to file ───────────────────────────────────────────────────────────

function saveReport(results: CheckResult[]): void {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const reportPath = path.join(REPORTS_DIR, `${DATE_STR}.json`);
  const existing   = fs.existsSync(reportPath)
    ? JSON.parse(fs.readFileSync(reportPath, 'utf-8')) as unknown[]
    : [];

  const entry = {
    ts:      new Date().toISOString(),
    env:     ENV,
    results: results.map(r => ({ name: r.name, status: r.status, summary: r.summary, durationMs: r.durationMs })),
  };

  (existing as unknown[]).push(entry);
  fs.writeFileSync(reportPath, JSON.stringify(existing, null, 2));
  console.log(`\n💾 Report saved: ${path.relative(ROOT, reportPath)}`);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n🚀 LKVIP Daily Report — ${new Date().toISOString()}`);
  console.log(`   Environment  : ${ENV}`);
  console.log(`   Unit tests   : ${NO_TESTS ? 'skipped' : 'enabled'}\n`);

  const start   = Date.now();
  const results = await runAllChecks();
  const totalMs = Date.now() - start;

  printReport(results, totalMs);
  saveReport(results);

  const hasCritical = results.some(r => r.status === 'fail');
  const hasWarnings = results.some(r => r.status === 'warn');

  if (hasCritical || hasWarnings) {
    await sendTelegram(buildTelegramMessage(results));
  }

  process.exit(hasCritical ? 1 : 0);
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
