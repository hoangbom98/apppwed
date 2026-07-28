'use strict';
/**
 * requirePermission(permission) — Granular permission check middleware.
 *
 * Usage (in any admin route file):
 *   const requirePermission = require('../../shared/middlewares/requirePermission');
 *
 *   router.get('/finance/transactions', requirePermission('finance.view'), ctrl.list);
 *   router.patch('/finance/deposits/:id/approve', requirePermission('finance.approve'), ctrl.approve);
 *   router.get('/risk/alerts', requirePermission('risk.view'), ctrl.listAlerts);
 *
 * Rules:
 *   • super_admin bypasses all permission checks — always passes.
 *   • admin role: must have the exact permission string stored in AdminRole.permissions[].
 *     Permissions are loaded on each request from the DB via AdminRole join on req.prisma.
 *   • Wildcard suffix: permission 'game.*' satisfies requirePermission('game.config').
 *
 * Permission strings must match the PERMISSION_TREE in roleController.listPermissions.
 * Format: '<group>.<action>' — e.g. 'finance.approve', 'risk.ip', 'settings.admins'
 *
 * Must run AFTER auth + adminGuard middlewares (req.user must exist).
 *
 * NOTE: This middleware queries the DB on every request. Use Redis caching
 * for role permissions if request volume justifies it (add to TODO).
 */

const { forbidden } = require('../../utils/network/response');

/**
 * Check if a user-held permission satisfies the required permission.
 * Supports wildcard suffix: 'game.*' covers 'game.config', 'game.view', etc.
 */
function permissionSatisfies(held: string, required: string): boolean {
  if (held === required) return true;
  if (held.endsWith('.*')) {
    const prefix = held.slice(0, -2); // strip '.*'
    return required.startsWith(prefix + '.');
  }
  return false;
}

/**
 * Returns an Express middleware that enforces the given permission.
 * @param permission  e.g. 'finance.approve', 'risk.view', 'settings.admins'
 */
module.exports = function requirePermission(permission: string) {
  return async (req: any, res: any, next: any) => {
    try {
      // super_admin bypasses all permission gates
      if (req.user?.role === 'super_admin') return next();

      if (!req.user || !req.prisma) {
        return forbidden(res, 'Không có quyền truy cập');
      }

      // Load the admin's role and its permissions from DB
      const adminUser = await req.prisma.adminUser.findUnique({
        where:   { id: req.user.id },
        include: { role: true },
      });

      const heldPermissions: string[] = adminUser?.role?.permissions ?? [];

      const allowed = heldPermissions.some(held =>
        permissionSatisfies(held, permission)
      );

      if (!allowed) {
        return forbidden(res, `Thiếu quyền: ${permission}`);
      }

      return next();
    } catch (err: any) {
      return forbidden(res, 'Không thể kiểm tra quyền');
    }
  };
};
