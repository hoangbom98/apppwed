/**
 * prisma.ts — Prisma schema utilities
 *
 * TypeScript rewrite of standardize-prisma.js
 *
 * Commands:
 *   lkvip prisma standardize   — add @map() snake_case annotations to all schema fields
 *   lkvip prisma generate      — run prisma generate for all 6 schemas
 *   lkvip prisma migrate       — run prisma migrate deploy for all 6 schemas
 *   lkvip prisma status        — show migration status for all 6 schemas
 */

import fs   from 'fs';
import path from 'path';
import { Command } from 'commander';
import { log, ok, warn, info, header } from '../utils/logger';
import { runNode, BACKEND_DIR } from '../utils/shell';

const PRISMA_DIR = path.join(BACKEND_DIR, 'prisma');

// ── Schema discovery ──────────────────────────────────────────────────────────

function findSchemas(): string[] {
  const schemas: string[] = [];
  for (const entry of fs.readdirSync(PRISMA_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const schemaPath = path.join(PRISMA_DIR, entry.name, 'schema.prisma');
    if (fs.existsSync(schemaPath)) schemas.push(schemaPath);
  }
  return schemas.sort();
}

// ── standardize — add @map() annotations ─────────────────────────────────────

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function processSchema(filePath: string): void {
  log(`Processing: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const newLines = lines.map((line) => {
    // Match Prisma model field lines (indented, camelCase identifier)
    const match = line.match(/^(\s+)([a-z][a-zA-Z0-9]+)(\s+[a-zA-Z0-9[\]?]+)(\s+@.*)?$/);
    if (!match) return line;

    const [, indent, fieldName, typePart, attrsPart = ''] = match;

    // Skip fields that already have @map, @relation, or @id
    if (attrsPart.includes('@map') || attrsPart.includes('@relation') || attrsPart.includes('@id')) {
      return line;
    }

    const snakeName = toSnakeCase(fieldName);
    // Only add @map if the snake_case name differs from the field name
    if (snakeName === fieldName) return line;

    return `${indent}${fieldName}${typePart}${attrsPart} @map("${snakeName}")`.trimEnd();
  });

  fs.writeFileSync(filePath, newLines.join('\n'));
}

export function standardizeSchemas(): void {
  const schemas = findSchemas();
  if (schemas.length === 0) {
    warn(`No schema.prisma files found under ${PRISMA_DIR}`);
    return;
  }
  for (const s of schemas) processSchema(s);
  ok(`Schema standardization complete — processed ${schemas.length} schema(s).`);
}

// ── Generate / migrate / status via npx prisma ────────────────────────────────

async function forEachSchema(
  command: string,
  extraArgs: string[] = [],
  label: string,
): Promise<void> {
  const schemas = findSchemas();
  if (schemas.length === 0) {
    warn(`No schema.prisma files found under ${PRISMA_DIR}`);
    return;
  }

  let ok_count = 0;
  let fail_count = 0;

  for (const schema of schemas) {
    const rel = path.relative(BACKEND_DIR, schema);
    info(`→ prisma ${command}: ${rel}`);
    try {
      await runNode('npx', ['prisma', command, `--schema=${schema}`, ...extraArgs], BACKEND_DIR);
      ok_count++;
    } catch {
      warn(`Failed: prisma ${command} for ${rel}`);
      fail_count++;
    }
  }

  if (fail_count === 0) ok(`${label} — ${ok_count} schema(s) processed.`);
  else warn(`${label} — ${ok_count} OK, ${fail_count} failed.`);
}

// ── Commander sub-command ─────────────────────────────────────────────────────

export function registerPrismaCommand(program: Command): void {
  const prisma = program
    .command('prisma')
    .description('Prisma schema utilities (standardize, generate, migrate, status)');

  prisma
    .command('standardize')
    .description('Add @map() snake_case annotations to all Prisma schema fields')
    .action(() => {
      header('LKVIP GROUP — Prisma Standardize');
      standardizeSchemas();
    });

  prisma
    .command('generate')
    .description('Run prisma generate for all 6 schemas')
    .action(async () => {
      header('LKVIP GROUP — Prisma Generate');
      await forEachSchema('generate', [], 'Generate');
    });

  prisma
    .command('migrate')
    .description('Run prisma migrate deploy for all 6 schemas (production)')
    .action(async () => {
      header('LKVIP GROUP — Prisma Migrate Deploy');
      await forEachSchema('migrate', ['deploy'], 'Migrate deploy');
    });

  prisma
    .command('status')
    .description('Show migration status for all 6 schemas')
    .action(async () => {
      header('LKVIP GROUP — Prisma Status');
      await forEachSchema('migrate', ['status'], 'Migrate status');
    });
}
