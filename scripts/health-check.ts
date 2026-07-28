#!/usr/bin/env tsx
/**
 * scripts/health-check.ts
 *
 * Multi-service Health Dashboard — DNS · SSL · HTTP · PM2 · Nginx
 *
 * Usage:
 *   tsx scripts/health-check.ts                        # one-shot (local)
 *   tsx scripts/health-check.ts --env production       # production URLs + DNS/SSL
 *   tsx scripts/health-check.ts --watch                # repeat every 60 s
 *   tsx scripts/health-check.ts --json                 # JSON output
 *
 * Env vars (optional):
 *   TELEGRAM_BOT_TOKEN   — bot token for alerts
 *   TELEGRAM_CHAT_ID     — admin chat/group ID
 */

import https  from 'https';
import http   from 'http';
import dns    from 'dns/promises';
import path   from 'path';
import fs     from 'fs';
import { execSync } from 'child_process';

// ── Load .env ─────────────────────────────────────────────────────────────────

const envFile = path.join(__dirname, '..', 'apps/backend/.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
  }
}

// ── CLI args ──────────────────────────────────────────────────────────────────

const args      = process.argv.slice(2);
const jsonMode  = args.includes('--json');
const watchMode = args.includes('--watch');
const env       = args.find((_, i) => args[i - 1] === '--env') ?? 'local';
const WATCH_MS  = 60_000;

const DOMAIN = 'tc-gaming.live';
const VPS_IP = '104.248.146.203';

// ── Service configs ───────────────────────────────────────────────────────────

interface ServiceConfig {
  name:      string;
  healthUrl: string;
  type:      'backend' | 'frontend';
}

const SERVICES_LOCAL: ServiceConfig[] = [
  { name: 'API',    healthUrl: 'http://localhost:5000/health', type: 'backend'  },
  { name: 'Hub',    healthUrl: 'http://localhost:5173',        type: 'frontend' },
  { name: 'Game',   healthUrl: 'http://localhost:5174',        type: 'frontend' },
  { name: 'Trade',  healthUrl: 'http://localhost:5177',        type: 'frontend' },
  { name: 'Sports', healthUrl: 'http://localhost:5178',        type: 'frontend' },
  { name: 'Dating', healthUrl: 'http://localhost:5176',        type: 'frontend' },
  { name: 'Admin',  healthUrl: 'http://localhost:5180',        type: 'frontend' },
];

const SERVICES_PROD: ServiceConfig[] = [
  { name: 'API',    healthUrl: `https://api.${DOMAIN}/health`,    type: 'backend'  },
  { name: 'Hub',    healthUrl: `https://hub.${DOMAIN}`,           type: 'frontend' },
  { name: 'Game',   healthUrl: `https://game.${DOMAIN}`,          type: 'frontend' },
  { name: 'Trade',  healthUrl: `https://trade.${DOMAIN}`,         type: 'frontend' },
  { name: 'Sports', healthUrl: `https://sports.${DOMAIN}`,        type: 'frontend' },
  { name: 'Dating', healthUrl: `https://dating.${DOMAIN}`,        type: 'frontend' },
  { name: 'Admin',  healthUrl: `https://admin.${DOMAIN}`,         type: 'frontend' },
];

const SERVICES = env === 'production' ? SERVICES_PROD : SERVICES_LOCAL;

// ── DNS subdomains (production-only check) ────────────────────────────────────

const DNS_SUBDOMAINS = [
  { sub: '',        name: 'Root'        },
  { sub: 'admin',   name: 'Admin'       },
  { sub: 'api',     name: 'API'         },
  { sub: 'dating',  name: 'Dating'      },
  { sub: 'game',    name: 'Game'        },
  { sub: 'hub',     name: 'Hub'         },
  { sub: 'sports',  name: 'Sports'      },
  { sub: 'trade',   name: 'Trade'       },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface FetchResult {
  status: number;
  body:   string;
  ms:     number;
  error?: string;
  ssl?:   boolean;
}

interface ServiceStatus {
  name:     string;
  url:      string;
  type:     'backend' | 'frontend';
  status:   'healthy' | 'degraded' | 'down' | 'offline';
  httpCode: number;
  ms:       number;
  detail?:  Record<string, unknown>;
  error?:   string;
}

interface DnsResult {
  hostname: string;
  name:     string;
  ips:      string;
  expected: string;
  ok:       boolean;
  error?:   string;
}

interface SslResult {
  hostname:   string;
  name:       string;
  ok:         boolean;
  httpCode:   number;
  error?:     string;
}

interface Pm2Process {
  name:   string;
  status: string;
  cpu:    number;
  memMb:  number;
}

// ── HTTP fetch ────────────────────────────────────────────────────────────────

function fetchUrl(url: string, timeoutMs = 8000, validateSsl = false): Promise<FetchResult> {
  const lib   = url.startsWith('https') ? https : http;
  const start = Date.now();

  return new Promise(resolve => {
    const req = lib.get(
      url,
      {
        headers:        { Accept: 'application/json' },
        rejectUnauthorized: validateSsl,
      } as any,
      (res: any) => {
        let body = '';
        res.on('data', (c: Buffer) => { body += c.toString(); });
        res.on('end', () => resolve({
          status:  res.statusCode ?? 0,
          body,
          ms:      Date.now() - start,
          ssl:     res.socket?.authorized ?? false,
        }));
      },
    );

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

async function checkService(svc: ServiceConfig): Promise<ServiceStatus> {
  const r = await fetchUrl(svc.healthUrl);

  if (r.error || r.status === 0) {
    return { name: svc.name, url: svc.healthUrl, type: svc.type, status: 'offline', httpCode: 0, ms: r.ms, error: r.error };
  }

  if (svc.type === 'backend') {
    try {
      const json = JSON.parse(r.body) as Record<string, unknown>;
      const s    = json.status as string;
      return {
        name:    svc.name,
        url:     svc.healthUrl,
        type:    svc.type,
        status:  s === 'healthy' ? 'healthy' : s === 'degraded' ? 'degraded' : s === 'ok' ? 'healthy' : 'down',
        httpCode: r.status,
        ms:      r.ms,
        detail:  json,
      };
    } catch {
      return { name: svc.name, url: svc.healthUrl, type: svc.type, status: r.status < 400 ? 'healthy' : 'down', httpCode: r.status, ms: r.ms };
    }
  }

  return {
    name:    svc.name,
    url:     svc.healthUrl,
    type:    svc.type,
    status:  r.status < 400 ? 'healthy' : 'down',
    httpCode: r.status,
    ms:      r.ms,
  };
}

// ── DNS check (production only) ───────────────────────────────────────────────

async function checkAllDns(): Promise<DnsResult[]> {
  return Promise.all(
    DNS_SUBDOMAINS.map(async ({ sub, name }) => {
      const hostname = sub ? `${sub}.${DOMAIN}` : DOMAIN;
      try {
        const addrs = await dns.lookup(hostname, { all: true });
        const ips = addrs.map(a => a.address).join(', ');
        return { hostname, name, ips, expected: 'resolves', ok: addrs.length > 0 };
      } catch (e: any) {
        return { hostname, name, ips: 'N/A', expected: 'resolves', ok: false, error: e.code ?? e.message };
      }
    }),
  );
}

// ── SSL check (production only) ───────────────────────────────────────────────

async function checkAllSsl(): Promise<SslResult[]> {
  return Promise.all(
    DNS_SUBDOMAINS.map(async ({ sub, name }) => {
      const hostname = sub ? `${sub}.${DOMAIN}` : DOMAIN;
      const r = await fetchUrl(`https://${hostname}`, 6000, true);
      return {
        hostname,
        name,
        ok:       !r.error && r.status > 0,
        httpCode: r.status,
        error:    r.error,
      };
    }),
  );
}

// ── PM2 check ─────────────────────────────────────────────────────────────────

function checkPm2(): Pm2Process[] {
  try {
    const raw      = execSync('pm2 jlist 2>/dev/null', { encoding: 'utf-8', timeout: 8000 });
    const list     = JSON.parse(raw) as any[];
    return list.map(p => ({
      name:   p.name as string,
      status: (p.pm2_env?.status ?? 'unknown') as string,
      cpu:    Number(p.monit?.cpu ?? 0),
      memMb:  Math.round(Number(p.monit?.memory ?? 0) / 1024 / 1024),
    }));
  } catch {
    return [];
  }
}

// ── Nginx check ───────────────────────────────────────────────────────────────

function checkNginx(): boolean {
  try {
    const out = execSync('nginx -t 2>&1', { encoding: 'utf-8', timeout: 5000 });
    return out.includes('successful');
  } catch {
    return false;
  }
}

// ── Telegram alert ────────────────────────────────────────────────────────────

async function sendTelegram(text: string): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' });
  const url  = `https://api.telegram.org/bot${token}/sendMessage`;

  await new Promise<void>(resolve => {
    const req = https.request(
      url,
      { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      res => { res.resume(); resolve(); },
    );
    req.on('error', () => resolve());
    req.write(body);
    req.end();
  });
}

// ── Text formatting ───────────────────────────────────────────────────────────

const SVC_ICON: Record<ServiceStatus['status'], string> = {
  healthy:  '✅',
  degraded: '⚠️ ',
  down:     '❌',
  offline:  '⚡',
};

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

function hr(n = 72): string { return '─'.repeat(n); }

function formatReport(
  services:  ServiceStatus[],
  dns:       DnsResult[]    | null,
  ssl:       SslResult[]    | null,
  pm2:       Pm2Process[]   | null,
  nginxOk:   boolean        | null,
): string {
  const lines: string[] = [];

  lines.push(`🚀 *LKVIP SYSTEM HEALTH CHECK*`);
  lines.push(`Time: ${new Date().toISOString()}`);
  lines.push(`Env:  ${env}`);
  if (env === 'production') lines.push(`VPS:  ${VPS_IP}`);
  lines.push('');

  // ── Services ──
  lines.push('🔌 *Services*');
  lines.push(hr());
  for (const s of services) {
    const ms   = s.ms < 8000 ? `${s.ms}ms` : 'n/a';
    const icon = SVC_ICON[s.status];
    lines.push(`${icon} ${pad(s.name, 10)} ${pad(s.status, 10)} ${ms}${s.error ? '  ' + s.error : ''}`);
  }
  lines.push('');

  // ── DNS ──
  if (dns) {
    lines.push('📡 *DNS Records*');
    lines.push(hr());
    for (const r of dns) {
      const icon = r.ok ? '✅' : '❌';
      lines.push(`${icon} ${pad(r.hostname, 32)} ${r.ok ? r.ips : (r.error ?? 'NOT FOUND')}`);
    }
    lines.push('');
  }

  // ── SSL ──
  if (ssl) {
    lines.push('🔒 *SSL Certificates*');
    lines.push(hr());
    for (const r of ssl) {
      const icon = r.ok ? '✅' : (r.httpCode > 0 ? '⚠️ ' : '❌');
      lines.push(`${icon} ${pad(r.hostname, 32)} HTTP ${r.httpCode || 'N/A'}${r.error ? '  ' + r.error : ''}`);
    }
    lines.push('');
  }

  // ── PM2 ──
  if (pm2 && pm2.length > 0) {
    lines.push('⚙️  *PM2 Processes*');
    lines.push(hr());
    for (const p of pm2) {
      const icon = p.status === 'online' ? '🟢' : '🔴';
      lines.push(`${icon} ${pad(p.name, 22)} ${pad(p.status, 10)} CPU:${p.cpu}%  Mem:${p.memMb}MB`);
    }
    lines.push('');
  } else if (pm2 !== null) {
    lines.push('⚙️  PM2: not available / not running');
    lines.push('');
  }

  // ── Nginx ──
  if (nginxOk !== null) {
    lines.push(`🔄 Nginx config: ${nginxOk ? '✅ OK' : '❌ Failed'}`);
    lines.push('');
  }

  // ── Summary ──
  const svcOk   = services.filter(s => s.status === 'healthy').length;
  const dnsOk   = dns  ? dns.filter(d => d.ok).length  : null;
  const sslOk   = ssl  ? ssl.filter(s => s.ok).length  : null;
  const pm2Ok   = pm2  ? pm2.filter(p => p.status === 'online').length : null;

  lines.push(hr());
  lines.push('📊 *SUMMARY*');
  lines.push(`Services : ${svcOk}/${services.length}`);
  if (dnsOk !== null) lines.push(`DNS      : ${dnsOk}/${dns!.length}`);
  if (sslOk !== null) lines.push(`SSL      : ${sslOk}/${ssl!.length}`);
  if (pm2Ok !== null) lines.push(`PM2      : ${pm2Ok}/${pm2!.length}`);
  if (nginxOk !== null) lines.push(`Nginx    : ${nginxOk ? '✅ OK' : '❌ Failed'}`);

  const allOk = services.every(s => s.status === 'healthy' || s.status === 'offline')
    && (dnsOk === null || dnsOk === dns!.length)
    && (sslOk === null || sslOk === ssl!.length)
    && (pm2Ok === null || pm2Ok === pm2!.length)
    && (nginxOk === null || nginxOk === true);

  lines.push('');
  lines.push(allOk ? '🎉 ALL SYSTEMS OPERATIONAL!' : '⚠️  SOME ISSUES DETECTED — see above.');
  lines.push(hr());

  return lines.join('\n');
}

// ── Main run ──────────────────────────────────────────────────────────────────

async function run(): Promise<boolean> {
  const isProd = env === 'production';

  const [services, dnsResults, sslResults] = await Promise.all([
    Promise.all(SERVICES.map(checkService)),
    isProd ? checkAllDns()  : Promise.resolve(null),
    isProd ? checkAllSsl()  : Promise.resolve(null),
  ]);

  const pm2Results   = isProd ? checkPm2()   : null;
  const nginxOk      = isProd ? checkNginx() : null;

  const report = formatReport(services, dnsResults, sslResults, pm2Results, nginxOk);

  if (jsonMode) {
    console.log(JSON.stringify({
      ts:       new Date().toISOString(),
      env,
      services,
      dns:      dnsResults,
      ssl:      sslResults,
      pm2:      pm2Results,
      nginx:    nginxOk,
    }, null, 2));
  } else {
    if (!watchMode) console.clear();
    console.log(report.replace(/\*/g, '').replace(/`/g, ''));
  }

  const hasProblems = services.some(s => s.status === 'degraded' || s.status === 'down')
    || (dnsResults !== null && dnsResults.some(d => !d.ok))
    || (sslResults !== null && sslResults.some(s => !s.ok && s.httpCode === 0))
    || (pm2Results !== null && pm2Results.some(p => p.status !== 'online'));

  if (hasProblems) {
    await sendTelegram(report);
  }

  return !hasProblems;
}

async function main(): Promise<void> {
  if (watchMode) {
    console.log(`🔄 Watch mode — every ${WATCH_MS / 1000}s. Ctrl+C to stop.\n`);
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
