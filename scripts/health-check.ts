#!/usr/bin/env tsx
/**
 * scripts/health-check.ts
 *
 * Multi-service Health Dashboard
 *
 * Checks every backend /health endpoint, all frontend origins, and sends a
 * Telegram alert when any service is degraded or down.
 *
 * Usage:
 *   tsx scripts/health-check.ts                     # one-shot check
 *   tsx scripts/health-check.ts --watch             # repeat every 60s
 *   tsx scripts/health-check.ts --json              # JSON output
 *   tsx scripts/health-check.ts --env production    # use production URLs
 *
 * Env vars used (optional):
 *   TELEGRAM_BOT_TOKEN   — bot token for alerts
 *   TELEGRAM_CHAT_ID     — admin chat/group ID
 */

import https from 'https';
import http  from 'http';
import path  from 'path';
import fs    from 'fs';

// ── Config ────────────────────────────────────────────────────────────────────

// Load .env if available
const envFile = path.join(__dirname, '..', 'apps/backend/.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
  }
}

const args      = process.argv.slice(2);
const jsonMode  = args.includes('--json');
const watchMode = args.includes('--watch');
const env       = args.find((_, i) => args[i - 1] === '--env') ?? 'local';
const WATCH_MS  = 60_000;

interface ServiceConfig {
  name:      string;
  healthUrl: string;
  type:      'backend' | 'frontend';
}

const SERVICES_LOCAL: ServiceConfig[] = [
  { name: 'API',    healthUrl: 'http://localhost:4000/health', type: 'backend'  },
  { name: 'Hub',    healthUrl: 'http://localhost:5173',        type: 'frontend' },
  { name: 'Game',   healthUrl: 'http://localhost:5174',        type: 'frontend' },
  { name: 'Trade',  healthUrl: 'http://localhost:5175',        type: 'frontend' },
  { name: 'Sports', healthUrl: 'http://localhost:5176',        type: 'frontend' },
  { name: 'Dating', healthUrl: 'http://localhost:5177',        type: 'frontend' },
  { name: 'Admin',  healthUrl: 'http://localhost:5180',        type: 'frontend' },
];

const SERVICES_PROD: ServiceConfig[] = [
  { name: 'API',    healthUrl: 'https://api.tc-gaming.live/health',     type: 'backend'  },
  { name: 'Hub',    healthUrl: 'https://hub.tc-gaming.live',            type: 'frontend' },
  { name: 'Game',   healthUrl: 'https://game.tc-gaming.live',           type: 'frontend' },
  { name: 'Trade',  healthUrl: 'https://trade.tc-gaming.live',          type: 'frontend' },
  { name: 'Sports', healthUrl: 'https://sports.tc-gaming.live',         type: 'frontend' },
  { name: 'Dating', healthUrl: 'https://dating.tc-gaming.live',         type: 'frontend' },
  { name: 'Admin',  healthUrl: 'https://admin.tc-gaming.live',          type: 'frontend' },
];

const SERVICES = env === 'production' ? SERVICES_PROD : SERVICES_LOCAL;

// ── HTTP fetch ────────────────────────────────────────────────────────────────

interface FetchResult {
  status:   number;
  body:     string;
  ms:       number;
  error?:   string;
}

function fetchUrl(url: string, timeoutMs = 6000): Promise<FetchResult> {
  const lib   = url.startsWith('https') ? https : http;
  const start = Date.now();

  return new Promise(resolve => {
    const req = lib.get(url, { headers: { 'Accept': 'application/json' } }, res => {
      let body = '';
      res.on('data', (c: Buffer) => { body += c.toString(); });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body, ms: Date.now() - start }));
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve({ status: 0, body: '', ms: timeoutMs, error: 'TIMEOUT' });
    });

    req.on('error', (e: NodeJS.ErrnoException) => {
      resolve({ status: 0, body: '', ms: Date.now() - start, error: e.code ?? e.message });
    });
  });
}

// ── Service check ─────────────────────────────────────────────────────────────

interface ServiceStatus {
  name:      string;
  url:       string;
  type:      'backend' | 'frontend';
  status:    'healthy' | 'degraded' | 'down' | 'offline';
  httpCode:  number;
  ms:        number;
  detail?:   Record<string, unknown>;   // parsed JSON from /health
  error?:    string;
}

async function checkService(svc: ServiceConfig): Promise<ServiceStatus> {
  const r = await fetchUrl(svc.healthUrl);

  if (r.error || r.status === 0) {
    return { name: svc.name, url: svc.healthUrl, type: svc.type, status: 'offline', httpCode: 0, ms: r.ms, error: r.error };
  }

  // Backend: parse JSON health payload
  if (svc.type === 'backend') {
    try {
      const json = JSON.parse(r.body) as Record<string, unknown>;
      const apiStatus = json.status as string;
      return {
        name:    svc.name,
        url:     svc.healthUrl,
        type:    svc.type,
        status:  apiStatus === 'healthy' ? 'healthy' : apiStatus === 'degraded' ? 'degraded' : 'down',
        httpCode: r.status,
        ms:      r.ms,
        detail:  json,
      };
    } catch {
      return { name: svc.name, url: svc.healthUrl, type: svc.type, status: r.status < 400 ? 'healthy' : 'down', httpCode: r.status, ms: r.ms };
    }
  }

  // Frontend: SPA returns HTML with 200 = alive
  return {
    name:    svc.name,
    url:     svc.healthUrl,
    type:    svc.type,
    status:  r.status < 400 ? 'healthy' : 'down',
    httpCode: r.status,
    ms:      r.ms,
  };
}

// ── Telegram alert ────────────────────────────────────────────────────────────

async function sendTelegram(text: string): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' });
  const url  = `https://api.telegram.org/bot${token}/sendMessage`;

  await new Promise<void>(resolve => {
    const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, res => {
      res.resume();
      resolve();
    });
    req.on('error', () => resolve());
    req.write(body);
    req.end();
  });
}

// ── Report formatting ─────────────────────────────────────────────────────────

const STATUS_ICON: Record<ServiceStatus['status'], string> = {
  healthy:  '✅',
  degraded: '⚠️ ',
  down:     '❌',
  offline:  '⚡',
};

function formatReport(statuses: ServiceStatus[]): string {
  const lines: string[] = [
    `🔍 *LKVIP Health Check* — ${new Date().toISOString()}`,
    `Environment: \`${env}\`\n`,
  ];

  for (const s of statuses) {
    const icon   = STATUS_ICON[s.status];
    const ms     = s.ms < 6000 ? `${s.ms}ms` : 'n/a';
    const detail = s.status === 'degraded' && s.detail?.databases
      ? `\n      DB: ${(s.detail.databases as Array<{name: string; status: string}>).map(d => `${d.name}:${d.status}`).join(', ')}`
      : '';
    lines.push(`${icon} *${s.name}*: ${s.status} (${ms}) ${s.error ?? ''}${detail}`);
  }

  const problems = statuses.filter(s => s.status !== 'healthy' && s.status !== 'offline');
  if (problems.length) {
    lines.push(`\n🚨 *${problems.length} service(s) need attention:* ${problems.map(p => p.name).join(', ')}`);
  } else if (statuses.every(s => s.status === 'offline')) {
    lines.push('\n⚡ All services offline (local dev server may not be running)');
  } else {
    lines.push('\n✅ All running services are healthy!');
  }

  return lines.join('\n');
}

// ── Main run ──────────────────────────────────────────────────────────────────

async function run(): Promise<boolean> {
  const statuses = await Promise.all(SERVICES.map(checkService));

  if (jsonMode) {
    console.log(JSON.stringify({ ts: new Date().toISOString(), env, services: statuses }, null, 2));
  } else {
    console.clear();
    console.log(formatReport(statuses).replace(/\*/g, '').replace(/`/g, ''));
  }

  const hasProblems = statuses.some(s => s.status === 'degraded' || s.status === 'down');
  if (hasProblems) {
    await sendTelegram(formatReport(statuses));
  }

  return !hasProblems;
}

async function main() {
  if (watchMode) {
    console.log(`🔄 Watch mode: checking every ${WATCH_MS / 1000}s. Ctrl+C to stop.\n`);
    while (true) {
      await run();
      await new Promise(r => setTimeout(r, WATCH_MS));
    }
  } else {
    const ok = await run();
    process.exit(ok ? 0 : 1);
  }
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
