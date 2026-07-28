const { getPrismaClient } = require('../../../config/databases');
const prisma = getPrismaClient('admin');

/**
 * Helper to log admin actions
 */
async function logAdminAction(userId, action, targetType, targetId, details = {}) {
  try {
    await prisma.adminLog.create({
      data: {
        userId,
        action,
        targetType,
        targetId,
        details,
      },
    });
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
}

module.exports = { logAdminAction };
