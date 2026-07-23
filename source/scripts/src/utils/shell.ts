/**
 * shell.ts — Helpers for running bash scripts and Node child processes
 *
 * Uses execa v5 (CommonJS-compatible).
 * On non-Linux platforms, bash script commands are stubbed with a warning
 * so the CLI can still be imported/type-checked on Windows/macOS.
 */

import path from 'path';
import { warn } from './logger';

// execa v5 exports are functions; the named export `execa` is what we want.
// Require it with a minimal inline type — avoids importing the ESM-only types.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { execa } = require('execa') as {
  execa: (
    file: string,
    args?: readonly string[],
    options?: {
      stdio?:  'inherit' | 'pipe' | 'ignore';
      cwd?:    string;
      env?:    NodeJS.ProcessEnv;
      reject?: boolean;
      [key: string]: unknown;
    }
  ) => Promise<{ exitCode: number; stdout: string; stderr: string }>;
};

/** Workspace root (3 levels above source/scripts/dist/) */
export const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..', '..');
/** source/ dir */
export const SOURCE_DIR      = path.join(WORKSPACE_ROOT, 'source');
/** source/backend/ dir */
export const BACKEND_DIR     = path.join(SOURCE_DIR, 'backend');
/** source/frontend/ dir */
export const FRONTEND_DIR    = path.join(SOURCE_DIR, 'frontend');
/** source/scripts/ dir */
export const SCRIPTS_DIR     = path.join(SOURCE_DIR, 'scripts');

/**
 * Run a bash script from source/scripts/, streaming stdout/stderr to the
 * parent process so the user sees coloured output in real-time.
 *
 * On Windows the call is skipped (with a warning) because the script
 * requires bash + Linux utilities.
 *
 * @param scriptName  File name inside source/scripts/ (e.g. "deploy.sh")
 * @param args        Extra CLI arguments forwarded to the script
 */
export async function runShellScript(scriptName: string, args: string[] = []): Promise<void> {
  if (process.platform === 'win32') {
    warn(`Skipping ${scriptName} on Windows — run on Linux/macOS or use WSL`);
    return;
  }

  const scriptPath = path.join(SCRIPTS_DIR, scriptName);
  await execa('bash', [scriptPath, ...args], {
    stdio: 'inherit',
    cwd:   WORKSPACE_ROOT,
    env:   { ...process.env, FORCE_COLOR: '1' },
  });
}

/** Options for runNode */
export interface RunNodeOptions {
  /** If true, stream output to the terminal (default: true) */
  stream?: boolean;
}

/**
 * Run a Node.js command (e.g. npm, npx, prisma) and stream output.
 *
 * @param bin   Executable name ('npm', 'npx', 'node', …)
 * @param args  Arguments
 * @param cwd   Working directory (defaults to WORKSPACE_ROOT)
 */
export async function runNode(
  bin: string,
  args: string[],
  cwd: string = WORKSPACE_ROOT,
  opts: RunNodeOptions = {},
): Promise<void> {
  const stream = opts.stream !== false;
  await execa(bin, args, {
    stdio: stream ? 'inherit' : 'pipe',
    cwd,
    env: { ...process.env, FORCE_COLOR: '1' },
  });
}

/**
 * Run a Node.js command silently and capture stdout.
 */
export async function captureNode(
  bin: string,
  args: string[],
  cwd: string = WORKSPACE_ROOT,
): Promise<string> {
  const result = await execa(bin, args, { cwd, reject: false });
  return result.stdout.trim();
}
