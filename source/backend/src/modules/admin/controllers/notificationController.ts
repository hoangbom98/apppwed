/**
 * notificationController.ts
 * Route: /admin/notifications/*
 *
 * Admin-initiated push notification endpoints:
 *   POST /admin/notifications/send         — send to one FCM token
 *   POST /admin/notifications/broadcast    — multicast to all active users (or filtered)
 *   POST /admin/notifications/send-user    — send to a specific userId (looks up FCM token)
 *   GET  /admin/notifications/status       — check if FCM is configured
 */

import { Request, Response } from 'express';
import pushService from '../../../shared/services/pushService';
const prisma = require('../../../shared/prisma');
const logger  = require('../../../shared/services/logger');

// ── POST /admin/notifications/send ────────────────────────────────────────────
export async function sendNotification(req: Request, res: Response) {
  try {
    const { token, title, body, data } = req.body;

    if (!token || !title || !body) {
      return res.status(400).json({ success: false, error: 'token, title, and body are required' });
    }

    if (!pushService.isAvailable) {
      return res.status(503).json({ success: false, error: 'Push notifications not configured (FCM not initialized)' });
    }

    const result = await pushService.sendToUser(token, title, body, data);
    return res.json({ success: true, data: { messageId: result } });
  } catch (err: any) {
    logger.error('[notificationController] sendNotification error', { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── POST /admin/notifications/send-user ───────────────────────────────────────
export async function sendToUser(req: Request, res: Response) {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ success: false, error: 'userId, title, and body are required' });
    }

    if (!pushService.isAvailable) {
      return res.status(503).json({ success: false, error: 'Push notifications not configured' });
    }

    // Look up FCM token from DB (project-agnostic)
    const project = (req as any).project as string | undefined;
    let fcmToken: string | null = null;

    if (project && project !== 'admin') {
      // Try project-specific user table
      const projectUser = await (prisma as any)[`${project}User`]?.findFirst({
        where: { userId },
        select: { fcmToken: true },
      }).catch(() => null);
      fcmToken = projectUser?.fcmToken ?? null;
    }

    // Fallback: check shared User table
    if (!fcmToken) {
      const user = await (prisma as any).user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      }).catch(() => null);
      fcmToken = user?.fcmToken ?? null;
    }

    if (!fcmToken) {
      return res.status(404).json({ success: false, error: 'FCM token not found for this user' });
    }

    const result = await pushService.sendToUser(fcmToken, title, body, data);
    return res.json({ success: true, data: { messageId: result, userId } });
  } catch (err: any) {
    logger.error('[notificationController] sendToUser error', { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── POST /admin/notifications/broadcast ───────────────────────────────────────
export async function broadcastNotification(req: Request, res: Response) {
  try {
    const { title, body, data, project: filterProject, limit = 500 } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, error: 'title and body are required' });
    }

    if (!pushService.isAvailable) {
      return res.status(503).json({ success: false, error: 'Push notifications not configured' });
    }

    // Fetch active users with FCM tokens
    const whereClause: any = {
      fcmToken: { not: null },
      status:   'active',
    };
    if (filterProject) {
      whereClause.userProjects = { some: { project: filterProject } };
    }

    const users = await (prisma as any).user.findMany({
      where:  whereClause,
      select: { id: true, fcmToken: true },
      take:   Math.min(Number(limit), 1000),
    });

    const tokens = users
      .map((u: any) => u.fcmToken)
      .filter((t: string | null): t is string => !!t);

    if (!tokens.length) {
      return res.json({ success: true, data: { sent: 0, message: 'No eligible users with FCM tokens' } });
    }

    const result = await pushService.sendMulticast(tokens, title, body, data);
    return res.json({
      success: true,
      data: {
        total:    tokens.length,
        sent:     result?.successCount ?? tokens.length,
        failed:   result?.failureCount ?? 0,
      },
    });
  } catch (err: any) {
    logger.error('[notificationController] broadcast error', { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── GET /admin/notifications/status ──────────────────────────────────────────
export async function getNotificationStatus(_req: Request, res: Response) {
  return res.json({
    success: true,
    data: {
      fcmAvailable: pushService.isAvailable,
      message: pushService.isAvailable
        ? 'FCM is configured and ready'
        : 'FCM not configured — set FIREBASE_SERVICE_ACCOUNT or place firebase-service-account.json',
    },
  });
}
