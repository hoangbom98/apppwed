#!/usr/bin/env node
/* eslint-disable */
// @ts-nocheck
/**
 * cli.js — LKVIP GROUP management CLI (plain Node.js, no TypeScript deps)
 *
 * Replaces source/scripts (TypeScript CLI) — inlined into the backend package.
 * All commands work cross-platform (Windows-safe env/health/prisma/build).
 *
 * Usage (from source/backend/):
 *   node src/scripts/cli.js <command> [options]
 *   npm run cli -- <command> [options]
 *
 * Commands:
 *   health [--url <url>] [--timeout <ms>]
 *   env    [--file <path>]
 *   build  [apps...] [--ci]
 *   prisma generate | migrate | status | standardize
 *   dev    [apps...] [--install]
 *   backup
 *   seed   [--demo]
 */
'use strict';

const path    = require('path');
const fs      = require('fs');
const { spawnSync, spawn } = require('child_process');

// ─── Paths ────────────────────────────────────────────────────────────────────

const BACKEND_DIR  = path.resolve(__dirname, '../..');
const SOURCE_DIR   = path.resolve(BACKEND_DIR, '..');
const FRONTEND_DIR = path.join(SOURCE_DIR, 'frontend');
const PRISMA_DIR   = path.join(BACKEND_DIR, 'prisma');
const SCRIPTS_DIR  = path.join(SOURCE_DIR, 'scripts');

// ─── Colour helpers ───────────────────────────────────────────────────────────

const C = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  blue:   '\x1b[34m',
  bold:   '\x1b[1m',
};

const ts   = () => `${C.green}[${new Date().toTimeString().slice(0,8)}]${C.reset}`;
const log  = (...a) => console.log(ts(), ...a);
const ok   = (...a) => console.log(`${C.green}  ✅${C.reset}`, ...a);
const warn = (...a) => console.warn(`${C.yellow}  ⚠️ ${C.reset}`, ...a);
const info = (...a) => console.log(`${C.blue}    ${C.reset}`, ...a);
const die  = (msg, code = 1) => { console.error(`${C.red}  ❌ ERROR: ${msg}${C.reset}`); process.exit(code); };
const header = (title) => {
  console.log(`\n${C.cyan}${'═'.repeat(55)}${C.reset}`);
  console.log(`${C.cyan}  ${title}${C.reset}`);
  console.log(`${C.cyan}${'═'.repeat(55)}${C.reset}\n`);
};

// ─── Arg parser (micro, no deps) ─────────────────────────────────────────────

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq > 0) {
        flags[a.slice(2, eq)] = a.slice(eq + 1);
      } else if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
        flags[a.slice(2)] = argv[++i];
      } else {
        flags[a.slice(2)] = true;
      }
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

// ─── Shell helpers ────────────────────────────────────────────────────────────

function runSync(bin, args, cwd = BACKEND_DIR) {
  const result = spawnSync(bin, args, { cwd, stdio: 'inherit', env: { ...process.env, FORCE_COLOR: '1' } });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${bin} exited with ${result.status}`);
}

function runAsync(bin, args, cwd = BACKEND_DIR) {
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { cwd, stdio: 'inherit', env: { ...process.env, FORCE_COLOR: '1' } });
    proc.on('error', reject);
    proc.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${bin} exited ${code}`)));
  });
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

// ─── HEALTH command ───────────────────────────────────────────────────────────

const HEALTH_CHECKS = [
  { name: 'API Health',    path: '/health' },
  { name: 'Hub Module',    path: '/api/hub/health',    optional: true },
  { name: 'Game Module',   path: '/api/game/health',   optional: true },
  { name: 'Trade Module',  path: '/api/trade/health',  optional: true },
  { name: 'Dating Module', path: '/api/dating/health', optional: true },
  { name: 'Sports Module', path: '/api/sports/health', optional: true },
  { name: 'Admin Module',  path: '/api/admin/health',  optional: true },
  { name: 'Swagger Docs',  path: '/api/docs/',          optional: true },
];

function httpGet(url, timeout) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? require('https') : require('http');
    const timer = setTimeout(() => reject(new Error('TIMEOUT')), timeout);
    lib.get(url, (res) => {
      clearTimeout(timer);
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    }).on('error', (e) => { clearTimeout(timer); reject(e); });
  });
}

async function cmdHealth(flags) {
  const baseUrl = flags['url'] || process.env.APP_URL || 'http://localhost:5000';
  const timeout = parseInt(flags['timeout'] || '5000', 10);
  header(`Health Check — ${baseUrl}`);
  let failed = 0;
  for (const check of HEALTH_CHECKS) {
    const url = `${baseUrl}${check.path}`;
    try {
      const { status, body } = await httpGet(url, timeout);
      const isOk = status >= 200 && status < 400;
      let extra = '';
      try { const j = JSON.parse(body); if (j.status) extra = ` (${j.status})`; } catch (_e) { /* ignore parse errors */ }
      if (isOk) {
        console.log(`  ✅  ${check.name.padEnd(20)} HTTP ${status}${extra}`);
      } else {
        console.log(`  ❌  ${check.name.padEnd(20)} HTTP ${status}`);
        if (!check.optional) failed++;
      }
    } catch (e) {
      const msg = e.message || 'UNKNOWN';
      if (check.optional) {
        console.log(`  ⚠️   ${check.name.padEnd(20)} ${msg} (optional)`);
      } else {
        console.log(`  ❌  ${check.name.padEnd(20)} ${msg}`);
        failed++;
      }
    }
  }
  console.log('─'.repeat(50));
  if (failed === 0) { ok('All required checks passed.'); }
  else { console.error(`❌  ${failed} required check(s) failed.`); process.exit(1); }
}

// ─── ENV command ──────────────────────────────────────────────────────────────

function envCheckVar(env, key) {
  return env[key] ? { key, status: 'ok', message: key }
                  : { key, status: 'missing', message: `MISSING: ${key}` };
}
function envCheckUrl(env, key) {
  if (!env[key]) return { key, status: 'missing', message: `MISSING: ${key}` };
  if (!env[key].startsWith('mysql://')) return { key, status: 'warn', message: `BAD FORMAT: ${key}` };
  return { key, status: 'ok', message: key };
}
function envCheckSecret(env, key, minLen = 32) {
  if (!env[key]) return { key, status: 'missing', message: `MISSING: ${key}` };
  if (env[key].length < minLen) return { key, status: 'warn', message: `TOO SHORT: ${key} (${env[key].length} < ${minLen})` };
  return { key, status: 'ok', message: `${key} (${env[key].length} chars)` };
}
function envCheckPort(env, key) {
  if (!env[key]) return { key, status: 'missing', message: `MISSING: ${key}` };
  const n = parseInt(env[key], 10);
  if (isNaN(n) || n < 1 || n > 65535) return { key, status: 'warn', message: `BAD PORT: ${key} = '${env[key]}'` };
  return { key, status: 'ok', message: `${key} = ${env[key]}` };
}
function renderEnv(r) {
  if (r.status === 'ok')      console.log(`  ✅  ${r.message}`);
  else if (r.status === 'warn') console.warn(`  ⚠️   ${r.message}`);
  else                          console.error(`  ❌  ${r.message}`);
}

function cmdEnv(flags) {
  const envFile = flags['file']
    ? (path.isAbsolute(flags['file']) ? flags['file'] : path.join(BACKEND_DIR, flags['file']))
    : path.join(BACKEND_DIR, '.env');

  header('LKVIP GROUP — Environment Check');
  log(`Loading env from: ${envFile}`);

  if (!fs.existsSync(envFile)) {
    die(`.env file not found: ${envFile}\n   Run: cp .env.example .env`);
  }

  const raw = fs.readFileSync(envFile, 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }

  let errors = 0, warnings = 0;
  const track = (r) => { renderEnv(r); if (r.status === 'missing') errors++; if (r.status === 'warn') warnings++; };

  console.log('── Server ─────────────────────────────────────────────');
  track(envCheckVar(env,    'NODE_ENV'));
  track(envCheckPort(env,   'PORT'));

  console.log('\n── JWT ────────────────────────────────────────────────');
  track(envCheckSecret(env, 'JWT_SECRET', 32));
  track(envCheckSecret(env, 'JWT_REFRESH_SECRET', 32));

  console.log('\n── Databases ──────────────────────────────────────────');
  for (const p of ['HUB', 'GAME', 'TRADE', 'DATING', 'SPORTS', 'ADMIN']) {
    track(envCheckUrl(env, `${p}_DATABASE_URL`));
  }

  console.log('\n── Redis ──────────────────────────────────────────────');
  track(envCheckVar(env, 'REDIS_URL'));

  console.log('\n── Security ───────────────────────────────────────────');
  track(envCheckSecret(env, 'ENCRYPTION_KEY', 32));
  track(envCheckVar(env,    'CORS_ORIGINS'));

  console.log('\n── Optional (info only) ───────────────────────────────');
  for (const k of ['SMTP_HOST','SMTP_USER','SMTP_PASS','MOMO_PARTNER_CODE','MOMO_ACCESS_KEY','MOMO_SECRET_KEY','ZALOPAY_APP_ID','VNPAY_TMN_CODE']) {
    console.log(env[k] ? `  ✅  ${k}` : `  ℹ️   NOT SET (optional): ${k}`);
  }

  console.log('\n─────────────────────────────────────────────────────');
  if (errors > 0) die(`${errors} missing required variable(s), ${warnings} warning(s). Fix in: ${envFile}`);
  if (warnings > 0) { warn(`${warnings} warning(s) — required vars all set.`); }
  else ok('All required environment variables are set and valid.');
}

// ─── PRISMA command ───────────────────────────────────────────────────────────

function findSchemas() {
  if (!fs.existsSync(PRISMA_DIR)) return [];
  return fs.readdirSync(PRISMA_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => path.join(PRISMA_DIR, e.name, 'schema.prisma'))
    .filter(p => fs.existsSync(p))
    .sort();
}

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
}

function processSchema(filePath) {
  log(`Processing: ${path.relative(BACKEND_DIR, filePath)}`);
  const content = fs.readFileSync(filePath, 'utf8');
  const newLines = content.split('\n').map(line => {
    const m = line.match(/^(\s+)([a-z][a-zA-Z0-9]+)(\s+[a-zA-Z0-9[\]?]+)(\s+@.*)?$/);
    if (!m) return line;
    const [, indent, fieldName, typePart, attrsPart = ''] = m;
    if (attrsPart.includes('@map') || attrsPart.includes('@relation') || attrsPart.includes('@id')) return line;
    const snake = toSnakeCase(fieldName);
    if (snake === fieldName) return line;
    return `${indent}${fieldName}${typePart}${attrsPart} @map("${snake}")`.trimEnd();
  });
  fs.writeFileSync(filePath, newLines.join('\n'));
}

async function cmdPrisma(sub, _flags) {
  if (sub === 'standardize') {
    header('LKVIP — Prisma Standardize');
    const schemas = findSchemas();
    if (schemas.length === 0) { warn(`No schemas found in ${PRISMA_DIR}`); return; }
    schemas.forEach(processSchema);
    ok(`Done — ${schemas.length} schema(s) processed.`);
    return;
  }

  const actionMap = { generate: ['generate'], migrate: ['migrate', 'deploy'], status: ['migrate', 'status'] };
  const prismaArgs = actionMap[sub];
  if (!prismaArgs) { die(`Unknown prisma sub-command: ${sub}. Use: standardize | generate | migrate | status`); }

  header(`LKVIP — Prisma ${sub}`);
  const schemas = findSchemas();
  if (schemas.length === 0) { warn(`No schemas found in ${PRISMA_DIR}`); return; }

  let passed = 0, failed = 0;
  for (const schema of schemas) {
    const rel = path.relative(BACKEND_DIR, schema);
    info(`→ prisma ${prismaArgs.join(' ')}: ${rel}`);
    try {
      await runAsync(npx, ['prisma', ...prismaArgs, `--schema=${schema}`], BACKEND_DIR);
      passed++;
    } catch {
      warn(`Failed: ${rel}`);
      failed++;
    }
  }
  if (failed === 0) ok(`prisma ${sub} — ${passed} schema(s).`);
  else warn(`prisma ${sub} — ${passed} OK, ${failed} failed.`);
}

// ─── BUILD command ────────────────────────────────────────────────────────────

const ALL_FRONTEND_APPS = ['hub', 'game', 'trade', 'dating', 'sports', 'admin-dashboard'];

function dirSize(dir) {
  let t = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    t += e.isDirectory() ? dirSize(f) : fs.statSync(f).size;
  }
  return t;
}
function fmtBytes(b) {
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b/1024).toFixed(0)}K`;
  return `${(b/1024/1024).toFixed(1)}M`;
}

async function buildApp(app) {
  const dir = path.join(FRONTEND_DIR, app);
  if (!fs.existsSync(dir)) { warn(`Not found: ${dir} — skipping ${app}`); return { app, status: 'skipped' }; }
  log(`Building ${app}…`);
  try {
    await runAsync(npm, ['ci', '--legacy-peer-deps', '--prefer-offline'], dir);
    await runAsync(npm, ['run', 'build'], dir);
    const dist = path.join(dir, 'dist');
    const size = fs.existsSync(dist) ? fmtBytes(dirSize(dist)) : '?';
    ok(`${app} → dist/ (${size})`);
    return { app, status: 'ok', size };
  } catch {
    warn(`${app} build FAILED`);
    return { app, status: 'failed' };
  }
}

async function cmdBuild(positional, flags) {
  const targets = positional.length > 0 ? positional : ALL_FRONTEND_APPS;
  const ci = !!flags['ci'];
  header('LKVIP GROUP — Build All Frontends');
  info(`Targets: ${targets.join(', ')}`);

  const results = [];
  for (const app of targets) {
    const r = await buildApp(app);
    results.push(r);
    if (r.status === 'failed' && ci) die(`Build failed in --ci mode: ${app}`);
  }

  console.log('\n' + '═'.repeat(55));
  console.log('  Build Summary');
  console.log('─'.repeat(55));
  console.log(`  ${'App'.padEnd(22)} ${'Status'.padEnd(10)} Size`);
  console.log('─'.repeat(55));
  let anyFailed = false;
  for (const r of results) {
    const icon = r.status === 'ok' ? '✅' : r.status === 'failed' ? '❌' : '⏭️ ';
    console.log(`  ${icon} ${r.app.padEnd(20)} ${r.status.padEnd(10)} ${r.size || '-'}`);
    if (r.status === 'failed') anyFailed = true;
  }
  console.log('═'.repeat(55));
  if (anyFailed) die('One or more builds failed.');
  else ok('All builds complete.');
}

// ─── DEV command ──────────────────────────────────────────────────────────────

const APP_PORTS = {
  backend: 5000, hub: 5173, game: 5174, dating: 5176,
  trade: 5177, sports: 5178, 'admin-dashboard': 5180,
};
const ALL_DEV_APPS = ['backend', 'hub', 'game', 'dating', 'trade', 'sports', 'admin-dashboard'];

function cmdDev(positional, flags) {
  const targets = positional.length > 0 ? positional : ALL_DEV_APPS;
  const doInstall = !!flags['install'];

  header('LKVIP GROUP — Dev');
  console.log('  App'.padEnd(25) + 'URL');
  console.log('─'.repeat(45));
  for (const app of targets) {
    console.log(`  ${app.padEnd(22)} http://localhost:${APP_PORTS[app] ?? '?'}`);
  }
  console.log('─'.repeat(45) + '\n');

  const procs = [];
  for (const app of targets) {
    const dir = app === 'backend' ? BACKEND_DIR : path.join(FRONTEND_DIR, app);
    if (!fs.existsSync(dir)) { warn(`Not found: ${dir} — skipping ${app}`); continue; }

    if (doInstall || !fs.existsSync(path.join(dir, 'node_modules'))) {
      log(`npm install: ${app}…`);
      spawnSync(npm, ['install', '--silent'], { cwd: dir, stdio: 'inherit' });
    }

    const proc = spawn(npm, ['run', 'dev'], { cwd: dir, stdio: 'pipe' });
    procs.push(proc);
    const prefix = `[${app}] `;
    proc.stdout?.on('data', d => process.stdout.write(prefix + d));
    proc.stderr?.on('data', d => process.stderr.write(prefix + d));
    proc.on('error', e => warn(`${app}: ${e.message}`));
    ok(`${app} started → http://localhost:${APP_PORTS[app] ?? '?'}`);
  }

  if (procs.length === 0) { warn('No processes started.'); return; }
  log(`${procs.length} dev server(s) running. Press Ctrl+C to stop all.`);

  const cleanup = () => {
    log('Stopping all dev servers…');
    procs.forEach(p => { try { p.kill(); } catch (_e) { /* ignore */ } });
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

// ─── BACKUP command ───────────────────────────────────────────────────────────

function cmdBackup(flags) {
  if (process.platform === 'win32') {
    header('LKVIP GROUP — Backup');
    warn('Backup must run on the Linux VPS (requires mysqldump + bash).');
    log('SSH into your VPS and run: bash source/scripts/backup-db.sh');
    return;
  }
  const scriptPath = path.join(SCRIPTS_DIR, 'backup-db.sh');
  if (!fs.existsSync(scriptPath)) { die(`backup-db.sh not found: ${scriptPath}`); }
  if (flags['dir'])       process.env.BACKUP_DIR       = flags['dir'];
  if (flags['retention']) process.env.RETENTION_DAYS   = flags['retention'];
  runSync('bash', [scriptPath], BACKEND_DIR);
}

// ─── SEED command ─────────────────────────────────────────────────────────────

async function cmdSeed(flags) {
  header('LKVIP GROUP — Seed');
  require('dotenv').config({ path: path.join(BACKEND_DIR, '.env') });
  if (flags['demo']) {
    log('Running demo seed…');
    const { seed } = require('./prisma/seeds/demo.seed');
    await seed();
  } else {
    const { main } = require('./prisma/seeds/all.seed');
    if (typeof main === 'function') await main();
    else {
      // all.seed.js runs on require — just require it
      require('./prisma/seeds/all.seed');
    }
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

const USAGE = `
LKVIP GROUP CLI

Usage:
  node src/scripts/cli.js <command> [options]
  npm run cli -- <command> [options]

Commands:
  health               HTTP health check for all service endpoints
  env                  Validate required .env variables
  build [apps...]      Build frontend apps  (--ci: fail fast)
  prisma <sub>         generate | migrate | status | standardize
  dev [apps...]        Start dev servers    (--install: run npm install first)
  backup               MySQL dump (Linux VPS only)
  seed                 Run all seeds        (--demo: include demo data)

Options (per command):
  health  --url <url>          Base URL (default: http://localhost:5000)
          --timeout <ms>       Request timeout (default: 5000)
  env     --file <path>        Path to .env file (default: .env)
  dev     --install            Run npm install before starting
  backup  --dir <path>         Backup directory
          --retention <days>   Days to retain backups
`.trim();

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    console.log(USAGE);
    return;
  }

  const [command, ...rest] = argv;
  const { flags, positional } = parseArgs(rest);

  switch (command) {
    case 'health': await cmdHealth(flags); break;
    case 'env':    cmdEnv(flags); break;
    case 'build':  await cmdBuild(positional, flags); break;
    case 'prisma': await cmdPrisma(positional[0], flags); break;
    case 'dev':    cmdDev(positional, flags); break;
    case 'backup': cmdBackup(flags); break;
    case 'seed':   await cmdSeed(flags); break;
    default:
      console.error(`Unknown command: ${command}\n`);
      console.log(USAGE);
      process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
