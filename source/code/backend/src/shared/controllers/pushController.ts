'use strict';
/**
 * Push subscription controller
 * Registered at each project's route prefix via shared/routes/push.routes.js
 *
 * POST   /push/subscribe     — save or update a web-push subscription
 * DELETE /push/unsubscribe   — remove a subscription
 * GET    /push/vapid-public-key — return the public VAPID key for the client
 */

const { ok, created, badRequest } = require('../utils/response');

/**
 * GET /push/vapid-public-key
 * Public — returns VAPID public key so the browser can subscribe.
 */
async function getVapidPublicKey(req, res) {
  const key = process.env.VAPID_PUBLIC_KEY || '';
  if (!key) return badRequest(res, 'Push notifications not configured on this server');
  return ok(res, { vapidPublicKey: key });
}

/**
 * POST /push/subscribe
 * Body: { endpoint, keys: { p256dh, auth } }
 * Protected — requires auth middleware upstream.
 */
async function subscribe(req, res, next) {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return badRequest(res, 'Invalid subscription payload — endpoint and keys required');
    }

    // Upsert: if the user resubscribes (browser refreshed VAPID keys) update it
    const sub = await req.prisma.pushSubscription.upsert({
      where:  { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth, userId: req.user.id, updatedAt: new Date() },
      create: {
        endpoint,
        p256dh:  keys.p256dh,
        auth:    keys.auth,
        userId:  req.user.id,
        project: req.project,
      },
    });

    return created(res, { id: sub.id }, 'Subscribed to push notifications');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /push/unsubscribe
 * Body: { endpoint }
 * Protected — requires auth middleware upstream.
 */
async function unsubscribe(req, res, next) {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return badRequest(res, 'endpoint required');

    await req.prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: req.user.id },
    });

    return ok(res, null, 'Unsubscribed');
  } catch (err) {
    next(err);
  }
}

module.exports = { getVapidPublicKey, subscribe, unsubscribe };
