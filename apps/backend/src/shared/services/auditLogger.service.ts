/**
 * auditLogger.service.ts
 * Ghi log mọi hành động nhạy cảm của Admin.
 */
import { logger } from '../../shared/logger';

export async function logAdminAction(
  adminId: string,
  action: string,
  target: string,
  oldValue: any,
  newValue: any,
  ip: string,
  prisma: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        target,
        oldValue: JSON.stringify(oldValue),
        newValue: JSON.stringify(newValue),
        ip,
        createdAt: new Date(),
      },
    });
    logger.info(`[AuditLog] Admin ${adminId} performed ${action} on ${target}`);
  } catch (err) {
    logger.error(`[AuditLog] Failed to log action: ${err.message}`);
  }
}
