/**
 * env.ts — Validate required environment variables from a .env file
 *
 * TypeScript rewrite of check-env.sh (Node.js-native — no bash needed).
 * Reads the .env file with dotenv and validates each variable.
 *
 * Usage (via CLI):
 *   lkvip env
 *   lkvip env --file code/backend/.env
 */

import fs   from 'fs';
import path from 'path';
import { Command } from 'commander';
import { config as dotenvConfig } from 'dotenv';
import { log, ok, warn, die, header, info } from '../utils/logger';
import { WORKSPACE_ROOT } from '../utils/shell';
import type { EnvCheckResult } from '../types';

// ── Check primitives ──────────────────────────────────────────────────────────

function checkVar(env: Record<string, string | undefined>, key: string): EnvCheckResult {
  const val = env[key];
  if (!val) return { key, status: 'missing', message: `MISSING: ${key}` };
  return { key, status: 'ok', message: `${key}` };
}

function checkUrl(env: Record<string, string | undefined>, key: string): EnvCheckResult {
  const val = env[key];
  if (!val)             return { key, status: 'missing', message: `MISSING: ${key}` };
  if (!val.startsWith('mysql://'))
    return { key, status: 'warn', message: `BAD FORMAT: ${key} (expected mysql://… got: ${val.slice(0, 20)}…)` };
  return { key, status: 'ok', message: key };
}

function checkSecret(env: Record<string, string | undefined>, key: string, minLen = 32): EnvCheckResult {
  const val = env[key];
  if (!val) return { key, status: 'missing', message: `MISSING: ${key}` };
  if (val.length < minLen)
    return { key, status: 'warn', message: `TOO SHORT: ${key} (${val.length} chars, need ≥${minLen})` };
  return { key, status: 'ok', message: `${key} (${val.length} chars)` };
}

function checkPort(env: Record<string, string | undefined>, key: string): EnvCheckResult {
  const val = env[key];
  if (!val) return { key, status: 'missing', message: `MISSING: ${key}` };
  const n = parseInt(val, 10);
  if (isNaN(n) || n < 1 || n > 65535)
    return { key, status: 'warn', message: `BAD PORT: ${key} = '${val}' (must be 1–65535)` };
  return { key, status: 'ok', message: `${key} = ${val}` };
}

// ── Render a single result ────────────────────────────────────────────────────

function render(r: EnvCheckResult): void {
  if (r.status === 'ok')      console.log(`  ✅  ${r.message}`);
  else if (r.status === 'warn')  console.warn(`  ⚠️   ${r.message}`);
  else                            console.error(`  ❌  ${r.message}`);
}

// ── Core validation logic ─────────────────────────────────────────────────────

export function runEnvCheck(envFile: string): { errors: number; warnings: number } {
  if (!fs.existsSync(envFile)) {
    die(`.env file not found: ${envFile}\n   Run: cp code/backend/.env.example code/backend/.env`);
  }

  // Load vars into a local object (do NOT pollute process.env)
  const raw = fs.readFileSync(envFile, 'utf8');
  const env: Record<string, string | undefined> = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }

  let errors = 0;
  let warnings = 0;

  const track = (r: EnvCheckResult) => {
    render(r);
    if (r.status === 'missing') errors++;
    if (r.status === 'warn')    warnings++;
  };

  console.log('── Server ─────────────────────────────────────────────');
  track(checkVar(env,    'NODE_ENV'));
  track(checkPort(env,   'PORT'));

  console.log('\n── JWT ────────────────────────────────────────────────');
  track(checkSecret(env, 'JWT_SECRET',         32));
  track(checkSecret(env, 'JWT_REFRESH_SECRET', 32));

  console.log('\n── Databases ──────────────────────────────────────────');
  for (const proj of ['HUB', 'GAME', 'TRADE', 'DATING', 'SPORTS', 'ADMIN']) {
    track(checkUrl(env, `${proj}_DATABASE_URL`));
  }

  console.log('\n── Redis ──────────────────────────────────────────────');
  track(checkVar(env, 'REDIS_URL'));

  console.log('\n── Security ───────────────────────────────────────────');
  track(checkSecret(env, 'ENCRYPTION_KEY', 32));
  track(checkVar(env,    'CORS_ORIGINS'));

  console.log('\n── Optional (warnings only) ───────────────────────────');
  const optionalVars = [
    'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS',
    'MOMO_PARTNER_CODE', 'MOMO_ACCESS_KEY', 'MOMO_SECRET_KEY',
    'ZALOPAY_APP_ID', 'VNPAY_TMN_CODE',
  ];
  for (const key of optionalVars) {
    const val = env[key];
    if (!val) console.log(`  ℹ️   NOT SET (optional): ${key}`);
    else      console.log(`  ✅  ${key}`);
  }

  return { errors, warnings };
}

// ── Commander sub-command ─────────────────────────────────────────────────────

export function registerEnvCommand(program: Command): void {
  program
    .command('env')
    .description('Validate all required environment variables in the .env file')
    .option('--file <path>', 'Path to .env file', 'code/backend/.env')
    .action((options: { file: string }) => {
      const envFile = path.isAbsolute(options.file)
        ? options.file
        : path.join(WORKSPACE_ROOT, options.file);

      header('LKVIP GROUP — Environment Check');
      log(`Loading env from: ${envFile}`);
      console.log('');

      const { errors, warnings } = runEnvCheck(envFile);

      console.log('\n─────────────────────────────────────────────────────');
      if (errors > 0) {
        die(`Found ${errors} missing required variable(s) and ${warnings} warning(s). Fix them in: ${envFile}`);
      } else if (warnings > 0) {
        warn(`${warnings} warning(s) found. Required variables are all set.`);
        process.exit(0);
      } else {
        ok('All required environment variables are set and valid.');
        process.exit(0);
      }
    });
}
