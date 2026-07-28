/**
 * Prisma Field-Level Encryption Middleware (AES-256-GCM)
 *
 * Tự động mã hóa các trường nhạy cảm khi write và giải mã khi read.
 * Dùng utilities từ @/shared/utils/encryption — không phụ thuộc thư viện ngoài.
 *
 * Sử dụng:
 *   import { applyEncryptionMiddleware } from '@/shared/prisma/encryptionMiddleware';
 *   const prisma = getPrismaClient('trade');
 *   applyEncryptionMiddleware(prisma);
 *
 * Cấu hình ENCRYPT_MAP:
 *   Thêm model/field vào ENCRYPT_MAP để mã hóa tự động.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClient = any;
import { encryptToString, decryptFromString } from '../utils/crypto/encryption';

/** Danh sách model và field cần mã hóa */
const ENCRYPT_MAP: Record<string, string[]> = {
  Wallet:          ['privateKey', 'seedPhrase'],
  BankAccount:     ['accountNumber', 'cardNumber'],
  PaymentGateway:  ['secretKey', 'apiKey'],
  User:            ['taxId'],
};

/** Actions ghi — cần encrypt */
const WRITE_ACTIONS = new Set([
  'create', 'createMany', 'update', 'updateMany', 'upsert',
]);

/** Actions đọc — cần decrypt */
const READ_ACTIONS = new Set([
  'findUnique', 'findFirst', 'findMany', 'findUniqueOrThrow', 'findFirstOrThrow',
]);

function encryptFields(model: string, data: Record<string, unknown>): void {
  const fields = ENCRYPT_MAP[model];
  if (!fields || !data) return;
  for (const field of fields) {
    if (field in data && data[field] != null && typeof data[field] === 'string') {
      data[field] = encryptToString(data[field] as string);
    }
  }
}

function decryptFields(model: string, record: Record<string, unknown>): void {
  const fields = ENCRYPT_MAP[model];
  if (!fields || !record) return;
  for (const field of fields) {
    if (field in record && record[field] != null && typeof record[field] === 'string') {
      try {
        record[field] = decryptFromString(record[field] as string);
      } catch {
        // Trường chưa bị mã hóa (dữ liệu cũ) — giữ nguyên
      }
    }
  }
}

/**
 * Áp dụng middleware mã hóa lên một PrismaClient instance.
 * Gọi ngay sau khi khởi tạo client, trước khi dùng bất kỳ query nào.
 */
export function applyEncryptionMiddleware(prisma: PrismaClient): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (prisma as any).$use(async (params: any, next: any) => {
    const model = params.model as string | undefined;
    if (!model || !ENCRYPT_MAP[model]) return next(params);

    // ── Encrypt before write ─────────────────────────────────────────────────
    if (WRITE_ACTIONS.has(params.action)) {
      if (params.args?.data) {
        encryptFields(model, params.args.data);
      }
      // createMany: args.data is an array
      if (Array.isArray(params.args?.data)) {
        for (const item of params.args.data) encryptFields(model, item);
      }
    }

    const result = await next(params);

    // ── Decrypt after read ───────────────────────────────────────────────────
    if (READ_ACTIONS.has(params.action)) {
      if (Array.isArray(result)) {
        for (const row of result) decryptFields(model, row);
      } else if (result && typeof result === 'object') {
        decryptFields(model, result as Record<string, unknown>);
      }
    }

    return result;
  });
}
