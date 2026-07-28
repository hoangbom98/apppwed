#!/usr/bin/env tsx
/**
 * scripts/check-routes.ts
 *
 * Route Scanner — parses every React Router <Route path=...> definition from each
 * frontend App.tsx and tests HTTP connectivity against the running dev servers.
 *
 * Usage:
 *   tsx scripts/check-routes.ts                     # test all apps
 *   tsx scripts/check-routes.ts --app game          # test one app
 *   tsx scripts/check-routes.ts --json              # output JSON
 *   tsx scripts/check-routes.ts --no-fetch          # just list routes, skip HTTP
 *
 * Ports (matches pnpm dev:* scripts):
 *   hub:5173  game:5174  trading:5175  sports:5176  dating:5177  admin-dashboard:5180
 */

import fs   from 'fs';
import path from 'path';
import http  from 'http';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');

interface AppConfig {
  name:       string;
  dir:        string;       // relative to ROOT
  routeFile:  string;       // relative to ROOT
  port:       number;
  baseUrl?:   string;       // override for production check
}

const APPS: AppConfig[] = [
  { name: 'hub',             dir: 'apps/hub',             routeFile: 'apps/hub/src/App.tsx',                              port: 5173 },
  { name: 'game',            dir: 'apps/game',            routeFile: 'apps/game/src/App.tsx',                             port: 5174 },
  { name: 'trading',         dir: 'apps/trading',         routeFile: 'apps/trading/src/App.tsx',                          port: 5175 },
  { name: 'sports',          dir: 'apps/sports',          routeFile: 'apps/sports/src/App.tsx',                           port: 5176 },
  { name: 'dating',          dir: 'apps/dating',          routeFile: 'apps/dating/src/App.tsx',                           port: 5177 },
  { name: 'admin-dashboard', dir: 'apps/admin-dashboard', routeFile: 'apps/admin-dashboard/src/core/routes/index.tsx',    port: 5180 },
];

// ── Arg parsing ───────────────────────────────────────────────────────────────

const args       = process.argv.slice(2);
const filterApp  = args.find((_, i) => args[i - 1] === '--app');
const jsonOutput = args.includes('--json');
const noFetch    = args.includes('--no-fetch');
const env        = args.find((_, i) => args[i - 1] === '--env') ?? 'local';
const baseUrlArg = args.find((_, i) => args[i - 1] === '--base-url');   // e.g. https://hub.tc-gaming.live

const PROD_ORIGINS: Record<string, string> = {
  hub:             'https://hub.tc-gaming.live',
  game:            'https://game.tc-gaming.live',
  trading:         'https://trade.tc-gaming.live',
  sports:          'https://sports.tc-gaming.live',
  dating:          'https://dating.tc-gaming.live',
  'admin-dashboard': 'https://admin.tc-gaming.live',
};

const selectedApps = filterApp ? APPS.filter(a => a.name === filterApp) : APPS;

// ── Route extraction ──────────────────────────────────────────────────────────

/**
 * Pull every literal path string from React Router <Route path="..."> or { path: '...' }
 * using two regex patterns to cover both JSX and object-literal styles.
 */
function extractRoutes(filePath: string): string[] {
  const abs = path.join(ROOT, filePath);
  if (!fs.existsSync(abs)) return [];

  const src = fs.readFileSync(abs, 'utf-8');

  // JSX:    path="/foo/bar"  or  path='/foo/bar'
  const jsxRe    = /\bpath=["']([^"'*?{}]+)["']/g;
  // Object: { path: '/foo/bar' }
  const objRe    = /\bpath:\s*["']([^"'*?{}]+)["']/g;

  const found = new Set<string>();
  let m: RegExpExecArray | null;

  while ((m = jsxRe.exec(src))  !== null) found.add(m[1]);
  while ((m = objRe.exec(src))  !== null) found.add(m[1]);

  // Normalise: ensure leading slash, drop pure param segments like ":id" (keep parents)
  const routes: string[] = [];
  for (const p of found) {
    const normalised = p.startsWith('/') ? p : `/${p}`;
    // Replace dynamic segments with a sample value for reachability testing
    const concrete = normalised.replace(/:[\w]+/g, '1');
    routes.push(concrete);
  }

  // Always include the root
  if (!routes.includes('/')) routes.unshift('/');

  return [...new Set(routes)].sort();
}

// ── HTTP probe ────────────────────────────────────────────────────────────────

interface ProbeResult {
  route:    string;
  url:      string;
  status:   number | 'ECONNREFUSED' | 'TIMEOUT' | 'ERROR';
  ok:       boolean;
  ms:       number;
}

function probe(url: string, timeoutMs = 5000): Promise<ProbeResult> {
  const route = new URL(url).pathname;
  const start = Date.now();
  const lib   = url.startsWith('https') ? https : http;

  return new Promise(resolve => {
    const req = lib.get(url, { headers: { 'Accept': 'text/html' } }, res => {
      res.resume();   // drain the body
      const ms     = Date.now() - start;
      const status = res.statusCode ?? 0;
      resolve({ route, url, status, ok: status < 400, ms });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve({ route, url, status: 'TIMEOUT', ok: false, ms: timeoutMs });
    });

    req.on('error', (err: NodeJS.ErrnoException) => {
      const ms = Date.now() - start;
      const status = err.code === 'ECONNREFUSED' ? 'ECONNREFUSED' : 'ERROR';
      resolve({ route, url, status, ok: false, ms });
    });
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface AppReport {
  app:       string;
  port:      number;
  routeFile: string;
  routes:    string[];
  results:   ProbeResult[];
  summary: {
    total:    number;
    ok:       number;
    errors:   number;
    unreachable: number;   // ECONNREFUSED — server not running
  };
}

async function checkApp(cfg: AppConfig): Promise<AppReport> {
  const routes = extractRoutes(cfg.routeFile);
  const origin = cfg.baseUrl ?? (env === 'production' ? PROD_ORIGINS[cfg.name] : undefined) ?? (baseUrlArg && selectedApps.length === 1 ? baseUrlArg : undefined) ?? `http://localhost:${cfg.port}`;

  if (!jsonOutput) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📱 ${cfg.name.toUpperCase().padEnd(20)} ${routes.length} routes → ${origin}`);
    console.log('─'.repeat(60));
  }

  let results: ProbeResult[] = [];

  if (!noFetch) {
    const tasks = routes.map(r => probe(`${origin}${r}`));
    results = await Promise.all(tasks);

    if (!jsonOutput) {
      for (const r of results) {
        const icon =
          r.status === 'ECONNREFUSED' ? '⚡' :
          r.status === 'TIMEOUT'      ? '⏱' :
          r.ok                        ? '✅' : '❌';
        const statusStr = String(r.status).padEnd(12);
        const msStr     = r.status !== 'ECONNREFUSED' ? `${r.ms}ms` : '(server off)';
        console.log(`  ${icon} ${r.route.padEnd(45)} ${statusStr} ${msStr}`);
      }
    }
  } else if (!jsonOutput) {
    for (const r of routes) {
      console.log(`  📍 ${r}`);
    }
  }

  const ok          = results.filter(r => r.ok).length;
  const errors      = results.filter(r => !r.ok && r.status !== 'ECONNREFUSED' && r.status !== 'TIMEOUT').length;
  const unreachable = results.filter(r => r.status === 'ECONNREFUSED').length;

  const summary = { total: routes.length, ok, errors, unreachable };

  if (!jsonOutput && !noFetch) {
    const serverOff = unreachable === routes.length;
    if (serverOff) {
      console.log(`  ⚡ Server not running on port ${cfg.port} — start with: pnpm dev:${cfg.name}`);
    } else {
      console.log(`\n  Summary: ${ok} OK / ${errors} errors / ${unreachable} server-off`);
    }
  }

  return { app: cfg.name, port: cfg.port, routeFile: cfg.routeFile, routes, results, summary };
}

async function main() {
  if (!jsonOutput) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log('🔍 LKVIP Route Scanner');
    console.log(`   Mode: ${noFetch ? 'list-only (--no-fetch)' : 'HTTP probe'}`);
    console.log(`   Apps: ${selectedApps.map(a => a.name).join(', ')}`);
    console.log('═'.repeat(60));
  }

  const reports: AppReport[] = [];
  for (const app of selectedApps) {
    reports.push(await checkApp(app));
  }

  // ── Grand summary ─────────────────────────────────────────────────────────
  if (jsonOutput) {
    console.log(JSON.stringify({ ts: new Date().toISOString(), reports }, null, 2));
  } else {
    const total    = reports.reduce((s, r) => s + r.summary.total,  0);
    const ok       = reports.reduce((s, r) => s + r.summary.ok,     0);
    const errors   = reports.reduce((s, r) => s + r.summary.errors, 0);
    const off      = reports.reduce((s, r) => s + r.summary.unreachable, 0);

    console.log(`\n${'═'.repeat(60)}`);
    console.log('📊 TOTAL SUMMARY');
    console.log(`   Routes scanned : ${total}`);
    if (!noFetch) {
      console.log(`   ✅ OK           : ${ok}`);
      console.log(`   ❌ Errors       : ${errors}`);
      console.log(`   ⚡ Server off   : ${off}`);
    }
    console.log('═'.repeat(60));

    if (errors > 0) {
      console.log('\n⚠️  Some routes returned 4xx/5xx. Check above for details.');
      process.exit(1);
    }
  }
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
