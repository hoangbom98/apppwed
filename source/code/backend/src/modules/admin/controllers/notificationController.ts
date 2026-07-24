// @ts-nocheck
/**
 * notificationController.ts
 * Route: /admin/notifications/*
 *
 * Admin-initiated push notification endpoints:
 *   GET  /admin/notifications/status       — check if FCM is configured
 *   POST /admin/notifications/send         — send to one FCM token
 *   POST /admin/notifications/send-user    — send to a specific userId (looks up FCM token)
 *   POST /admin/notifications/broadcast    — multicast to all active users (or filtered)
 */
'use strict';

const pushService = require('../../../shared/services/pushService').default
                 || require('../../../shared/services/pushService');
const logger      = require('../../../shared/services/logger');
const { getPrismaClient } = require('../../../shared/config/databases');

// ── GET /admin/notifications/status ──────────────────────────────────────────
exports.getNotificationStatus = async (req, res) => {
  const svc = pushService?.default ?? pushService;
  return res.json({
    success: true,
    data: {
      fcmAvailable: !!(svc?.isAvailable),
      message: svc?.isAvailable
        ? 'FCM is configured and ready'
        : 'FCM not configured — set FIREBASE_SERVICE_ACCOUNT or place firebase-service-account.json next to package.json',
    },
  });
};

// ── POST /admin/notifications/send ────────────────────────────────────────────
exports.sendNotification = async (req, res) => {
  try {
    const { token, title, body, data } = req.body;

    if (!token || !title || !body) {
      return res.status(400).json({ success: false, error: 'token, title, and body are required' });
    }

    const svc = pushService?.default ?? pushService;
    if (!svc?.isAvailable) {
      return res.status(503).json({ success: false, error: 'Push notifications not configured (FCM not initialized)' });
    }

    const result = await svc.sendToUser(token, title, body, data);
    return res.json({ success: true, data: { messageId: result } });
  } catch (err) {
    logger.error('[notificationController] sendNotification error', { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /admin/notifications/send-user ───────────────────────────────────────
exports.sendToUser = async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ success: false, error: 'userId, title, and body are required' });
    }

    const svc = pushService?.default ?? pushService;
    if (!svc?.isAvailable) {
      return res.status(503).json({ success: false, error: 'Push notifications not configured' });
    }

    // Look up FCM token from shared hub DB (User table)
    const prisma = getPrismaClient('hub');
    let fcmToken = null;

    try {
      const user = await prisma.user.findUnique({
        where:  { id: userId },
        select: { fcmToken: true },
      });
      fcmToken = user?.fcmToken ?? null;
    } catch (_err) {
      // table may not have fcmToken column — ignore
    }

    if (!fcmToken) {
      return res.status(404).json({ success: false, error: 'FCM token not found for this user' });
    }

    const result = await svc.sendToUser(fcmToken, title, body, data);
    return res.json({ success: true, data: { messageId: result, userId } });
  } catch (err) {
    logger.error('[notificationController] sendToUser error', { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /admin/notifications/broadcast ───────────────────────────────────────
exports.broadcastNotification = async (req, res) => {
  try {
    const { title, body, data, project: filterProject, limit = 500 } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, error: 'title and body are required' });
    }

    const svc = pushService?.default ?? pushService;
    if (!svc?.isAvailable) {
      return res.status(503).json({ success: false, error: 'Push notifications not configured' });
    }

    // Fetch active users with FCM tokens from hub DB
    const prisma = getPrismaClient('hub');

    const whereClause = {
      fcmToken: { not: null },
      status:   'active',
    };
    if (filterProject) {
      whereClause.userProjects = { some: { project: filterProject } };
    }

    let users = [];
    try {
      users = await prisma.user.findMany({
        where:  whereClause,
        select: { id: true, fcmToken: true },
        take:   Math.min(Number(limit), 1000),
      });
    } catch (_err) {
      // fcmToken field may not exist yet — return helpful error
      return res.status(503).json({
        success: false,
        error:   'fcmToken column not found on User table. Run a migration to add it first.',
      });
    }

    const tokens = users
      .map(u => u.fcmToken)
      .filter(t => !!t);

    if (!tokens.length) {
      return res.json({ success: true, data: { sent: 0, message: 'No eligible users with FCM tokens' } });
    }

    const result = await svc.sendMulticast(tokens, title, body, data);
    return res.json({
      success: true,
      data: {
        total:  tokens.length,
        sent:   result?.successCount ?? tokens.length,
        failed: result?.failureCount ?? 0,
      },
    });
  } catch (err) {
    logger.error('[notificationController] broadcast error', { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
};
