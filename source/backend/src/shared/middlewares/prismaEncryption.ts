// @ts-nocheck
/**
 * prismaEncryption.ts — Tầng 4: PII Encryption Middleware
 *
 * Wraps any Prisma client with a $use extension that:
 *  - ENCRYPTS phone & email on create/update (using AES-256-GCM from encryption.ts)
 *  - DECRYPTS phone & email on read (findUnique, findFirst, findMany)
 *
 * Usage — wrap each Prisma client once at startup:
 *   const { applyEncryptionMiddleware } = require('./prismaEncryption');
 *   applyEncryptionMiddleware(getPrismaClient('game'));
 *   applyEncryptionMiddleware(getPrismaClient('dating'));
 *
 * SENSITIVE_FIELDS controls which fields are encrypted per model.
 * The encrypted format is: "iv:tag:data" (compact string from encryptToString).
 *
 * NOTE: Once encrypted, all WHERE clauses on phone/email must use encrypted
 * values too. Use sha256(value) as a secondary "hash index" field for exact
 * lookups (see emailHash / phoneHash pattern below).
 */

'use strict';

import { encryptToString, decryptFromString } from '../utils/encryption';
const logger = require('../services/logger');

// ── Models and fields to encrypt ─────────────────────────────────────────

const SENSITIVE_FIELDS: Record<string, string[]> = {
  User:      ['phone', 'email'],
  KycDocument: ['frontImage', 'backImage', 'selfieImage'],
};

// ── Detect if a value looks like our encrypted format iv:tag:data ────────
const ENCRYPTED_RE = /^[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+$/i;

function isEncrypted(val: string): boolean {
  return typeof val === 'string' && ENCRYPTED_RE.test(val);
}

// ── Encrypt a single record's sensitive fields ────────────────────────────
function encryptRecord(model: string, data: Record<string, any>): Record<string, any> {
  const fields = SENSITIVE_FIELDS[model];
  if (!fields || !data) return data;

  const out = { ...data };
  for (const field of fields) {
    const val = out[field];
    if (val && typeof val === 'string' && !isEncrypted(val)) {
      try {
        out[field] = encryptToString(val);
      } catch (e: any) {
        logger.warn(`[PrismaEncryption] Failed to encrypt ${model}.${field}: ${e.message}`);
      }
    }
  }
  return out;
}

// ── Decrypt a single record's sensitive fields ────────────────────────────
function decryptRecord(model: string, data: Record<string, any>): Record<string, any> {
  const fields = SENSITIVE_FIELDS[model];
  if (!fields || !data) return data;

  const out = { ...data };
  for (const field of fields) {
    const val = out[field];
    if (val && isEncrypted(val)) {
      try {
        out[field] = decryptFromString(val);
      } catch (e: any) {
        logger.warn(`[PrismaEncryption] Failed to decrypt ${model}.${field}: ${e.message}`);
        // Return raw encrypted value rather than crashing
      }
    }
  }
  return out;
}

// ── Apply middleware to a Prisma client ───────────────────────────────────

export function applyEncryptionMiddleware(prisma: any): void {
  if (!prisma || typeof prisma.$use !== 'function') return;

  prisma.$use(async (params: any, next: any) => {
    const model = params.model as string;

    // ── WRITE: encrypt on create / update / upsert ──────────────────────
    if (['create', 'update', 'upsert'].includes(params.action)) {
      if (params.args?.data) {
        params.args.data = encryptRecord(model, params.args.data);
      }
      // upsert has create + update sub-objects
      if (params.action === 'upsert') {
        if (params.args?.create) params.args.create = encryptRecord(model, params.args.create);
        if (params.args?.update) params.args.update = encryptRecord(model, params.args.update);
      }
    }

    const result = await next(params);

    // ── READ: decrypt on find* results ──────────────────────────────────
    if (['findUnique', 'findFirst', 'findUniqueOrThrow', 'findFirstOrThrow'].includes(params.action)) {
      if (result) return decryptRecord(model, result);
    }
    if (params.action === 'findMany') {
      if (Array.isArray(result)) return result.map((r: any) => decryptRecord(model, r));
    }

    return result;
  });
}
