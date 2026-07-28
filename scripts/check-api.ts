#!/usr/bin/env tsx
/**
 * scripts/check-api.ts
 *
 * Backend API Route Auditor
 *
 * Reads all Express route files in apps/backend/src/ and produces:
 *  1. A complete inventory of every registered API endpoint
 *  2. HTTP reachability probes against the running API server
 *  3. A coverage gap report: routes with no corresponding test file
 *
 * Usage:
 *   tsx scripts/check-api.ts                   # audit + probe
 *   tsx scripts/check-api.ts --no-fetch        # list routes only
 *   tsx scripts/check-api.ts --json            # JSON output
 *   tsx scripts/check-api.ts --base-url https://api.tc-gaming.live
 *
 * Default API base: http://localhost:5000   (matches dev:backend PORT=5000)
 */

import fs   from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────

const ROOT        = path.resolve(__dirname, '..');
const BACKEND_SRC = path.join(ROOT, 'apps/backend/src');
const TEST_DIR    = path.join(ROOT, 'apps/backend/src/__tests__');
const DEFAULT_API = 'http://localhost:5000';

const args       = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const noFetch    = args.includes('--no-fetch');
const baseUrl    = args.find((_, i) => args[i - 1] === '--base-url') ?? DEFAULT_API;

// ── Route file discovery ──────────────────────────────────────────────────────

/**
 * Walk a directory recursively and collect all .ts files.
 */
function walkTs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkTs(full));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      results.push(full);
    }
  }
  return results;
}

// ── Route extraction ──────────────────────────────────────────────────────────

interface Route {
  method:  string;
  path:    string;
  file:    string;       // relative to BACKEND_SRC
  fullPath?: string;     // resolved against module prefix
}

const METHOD_RE = /router\.(get|post|put|patch|delete|all)\(\s*['"`]([^'"`]+)['"`]/g;

function extractRoutes(file: string): Route[] {
  const src     = fs.readFileSync(file, 'utf-8');
  const rel     = path.relative(BACKEND_SRC, file);
  const routes: Route[] = [];

  let m: RegExpExecArray | null;
  while ((m = METHOD_RE.exec(src)) !== null) {
    routes.push({ method: m[1].toUpperCase(), path: m[2], file: rel });
  }
  METHOD_RE.lastIndex = 0;   // reset stateful regex
  return routes;
}

// Module prefix map — derived from server.ts app.use() calls
const MODULE_PREFIXES: Record<string, string> = {
  'modules/hub/routes':     '/api/hub',
  'modules/game/routes':    '/api/game',
  'modules/trade/routes':   '/api/trade',
  'modules/dating/routes':  '/api/dating',
  'modules/sports/routes':   '/api/sports',
  'modules/lkvip/routes':   '/api/lkvip',
  'modules/admin/routes':   '/api/admin',
  'shared/routes':           '/api/shared',
};

// Route files mounted below a module prefix must retain that nested mount.
const NESTED_PREFIXES: Record<string, string> = {
  'shared/routes/payment-admin.routes': '/api/admin/payment/gateways',
};

function resolvePrefix(file: string): string {
  const normalized = file.replace(/\\/g, '/');
  for (const [seg, prefix] of Object.entries(NESTED_PREFIXES)) {
    if (normalized.includes(seg)) return prefix;
  }
  for (const [seg, prefix] of Object.entries(MODULE_PREFIXES)) {
    if (normalized.includes(seg)) return prefix;
  }
  return '/api/v1';
}

// ── HTTP probe ────────────────────────────────────────────────────────────────

interface ProbeResult {
  method:  string;
  path:    string;
  url:     string;
  status:  number | 'ECONNREFUSED' | 'TIMEOUT' | 'ERROR';
  ok:      boolean;   // true = not a server error (401/403/404/422 are "expected" for unauthed)
  ms:      number;
}

function probe(method: string, url: string, timeoutMs = 4000): Promise<ProbeResult> {
  const start = Date.now();
  const lib   = url.startsWith('https') ? https : http;

  return new Promise(resolve => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || (url.startsWith('https') ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   method === 'GET' || method === 'DELETE' ? method : 'GET',   // use GET for discovery
      headers:  { 'Accept': 'application/json' },
    };

    const req = lib.request(options, res => {
      res.resume();
      const ms     = Date.now() - start;
      const status = res.statusCode ?? 0;
      // 401/403/422 = route exists but unauthed → OK for audit purposes
      // 404/500 = problem
      const ok = status !== 404 && status < 500;
      resolve({ method, path: parsed.pathname, url, status, ok, ms });
    });

    req.setTimeout(timeoutMs, () => { req.destroy(); resolve({ method, path: parsed.pathname, url, status: 'TIMEOUT',      ok: false, ms: timeoutMs }); });
    req.on('error', (e: NodeJS.ErrnoException) => {
      resolve({ method, path: parsed.pathname, url, status: e.code === 'ECONNREFUSED' ? 'ECONNREFUSED' : 'ERROR', ok: false, ms: Date.now() - start });
    });
    req.end();
  });
}

// ── Coverage gap analysis ─────────────────────────────────────────────────────

function getTestedModules(): Set<string> {
  const tested = new Set<string>();
  const testFiles = walkTs(TEST_DIR);
  for (const f of testFiles) {
    const name = path.basename(f, '.test.ts').toLowerCase();
    tested.add(name);
  }
  return tested;
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface ModuleReport {
  module:   string;
  prefix:   string;
  routes:   Route[];
  probes:   ProbeResult[];
  hasCoverage: boolean;
}

async function main() {
  // 1. Discover all route files
  const allFiles  = walkTs(BACKEND_SRC);
  const routeFiles = allFiles.filter(f => {
    const rel = f.replace(/\\/g, '/');
    return rel.includes('/routes/')
      && !rel.includes('__tests__')
      && !rel.endsWith('/modules/admin/routes/config.routes.ts');
  });

  if (!jsonOutput) {
    console.log(`\n${'═'.repeat(65)}`);
    console.log('🔍 LKVIP Backend API Auditor');
    console.log(`   Route files  : ${routeFiles.length}`);
    console.log(`   Base URL     : ${baseUrl}`);
    console.log(`   Mode         : ${noFetch ? 'list-only' : 'HTTP probe'}`);
    console.log('═'.repeat(65));
  }

  // 2. Extract routes grouped by module
  const byModule: Record<string, Route[]> = {};
  for (const f of routeFiles) {
    const rel    = path.relative(BACKEND_SRC, f);
    const prefix = resolvePrefix(rel);
    const mod    = prefix.replace('/api/', '');
    const routes = extractRoutes(f);
    if (routes.length === 0) continue;
    byModule[mod] = byModule[mod] ?? [];
    byModule[mod].push(...routes.map(r => ({ ...r, fullPath: `${prefix}${r.path}` })));
  }

  // 3. Coverage analysis
  const testedModules = getTestedModules();

  // 4. Probe each module
  const reports: ModuleReport[] = [];

  for (const [mod, routes] of Object.entries(byModule)) {
    const prefix     = `/api/${mod}`;
    const hasCoverage = testedModules.has(mod) || testedModules.has(`${mod}service`) || testedModules.has(`${mod}Service`);

    if (!jsonOutput) {
      const covBadge = hasCoverage ? '✅' : '⚠️ ';
      console.log(`\n${covBadge} ${mod.toUpperCase()} (${routes.length} routes, coverage: ${hasCoverage ? 'yes' : 'NO'})`);
    }

    let probes: ProbeResult[] = [];

    if (!noFetch) {
      // Only probe GET routes that don't require a body or complex auth setup
      const probeCandidates = routes
        .filter(r => r.method === 'GET')
        .slice(0, 8);   // cap at 8 per module to avoid flooding

      probes = await Promise.all(
        probeCandidates.map(r => {
          const concretePath = (r.fullPath ?? r.path).replace(/:[\w]+/g, '1');
          return probe(r.method, `${baseUrl}${concretePath}`);
        })
      );
    }

    if (!jsonOutput) {
      const display = noFetch ? routes : routes;
      for (const r of display) {
        const probe  = probes.find(p => p.path.startsWith(r.path.replace(/:[\w]+/g, '1').substring(0, 20)));
        const status = probe ? ` → ${String(probe.status).padEnd(3)} (${probe.ms}ms)` : '';
        const icon   = probe?.ok === true ? '  ✅' : probe?.ok === false ? '  ❌' : '   ';
        console.log(`${icon} [${r.method.padEnd(6)}] ${(r.fullPath ?? r.path).padEnd(50)}${status}`);
      }
    }

    reports.push({ module: mod, prefix, routes, probes, hasCoverage });
  }

  // 5. Summary
  const totalRoutes   = Object.values(byModule).reduce((s, r) => s + r.length, 0);
  const coveredMods   = reports.filter(r => r.hasCoverage).length;
  const uncoveredMods = reports.filter(r => !r.hasCoverage).map(r => r.module);
  const allProbes     = reports.flatMap(r => r.probes);
  const probeOk       = allProbes.filter(p => p.ok).length;
  const probeErr      = allProbes.filter(p => !p.ok && p.status !== 'ECONNREFUSED').length;
  const serverOff     = allProbes.every(p => p.status === 'ECONNREFUSED');

  if (jsonOutput) {
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      totalRoutes,
      modules: reports.map(r => ({
        module:      r.module,
        routeCount:  r.routes.length,
        hasCoverage: r.hasCoverage,
        probeOk:     r.probes.filter(p => p.ok).length,
        probeErr:    r.probes.filter(p => !p.ok).length,
      })),
    }, null, 2));
  } else {
    console.log(`\n${'═'.repeat(65)}`);
    console.log('📊 SUMMARY');
    console.log(`   Total API routes     : ${totalRoutes}`);
    console.log(`   Modules with tests   : ${coveredMods} / ${reports.length}`);
    if (uncoveredMods.length) {
      console.log(`   ⚠️  No test coverage  : ${uncoveredMods.join(', ')}`);
    }
    if (!noFetch) {
      if (serverOff) {
        console.log(`   ⚡ API server is not running at ${baseUrl}`);
        console.log(`      Start with: pnpm dev:backend`);
      } else {
        console.log(`   ✅ Probe OK          : ${probeOk}`);
        console.log(`   ❌ Probe errors      : ${probeErr}`);
      }
    }
    console.log('═'.repeat(65));
  }
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
