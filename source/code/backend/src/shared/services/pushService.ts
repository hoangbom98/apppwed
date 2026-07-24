// @ts-nocheck
/* eslint-disable */

/**
 * pushService.ts — Firebase Cloud Messaging push notifications.
 *
 * Firebase Admin SDK v13+ uses a modular API. This file uses the
 * app-instance pattern to stay compatible with both v12 and v13.
 *
 * Gracefully no-ops when:
 *   - firebase-service-account.json is missing (dev / non-FCM environments)
 *   - FIREBASE_SERVICE_ACCOUNT env var not set
 */
import fs from 'fs';
import path from 'path';

const logger = require('../../shared/services/logger');

let _messaging: any = null;

// ── Initialize Firebase Admin ─────────────────────────────────────────────────
(function initFirebase() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const firebaseAdmin = require('firebase-admin');

    // Skip if already initialized
    if (firebaseAdmin.apps?.length) {
      _messaging = firebaseAdmin.messaging();
      return;
    }

    // Try file-based service account first
    const serviceAccountPath = path.join(__dirname, '../../../firebase-service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
      const app = firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount),
      });
      _messaging = app.messaging();
      logger.info('[Push] Firebase Admin initialized from service account file');
      return;
    }

    // Try env-var service account
    const envCreds = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (envCreds) {
      const serviceAccount = JSON.parse(envCreds);
      const app = firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount),
      });
      _messaging = app.messaging();
      logger.info('[Push] Firebase Admin initialized from env var');
      return;
    }

    logger.info('[Push] Firebase Admin not configured — push notifications disabled');
  } catch (err: any) {
    logger.warn(`[Push] Firebase Admin init failed: ${err.message} — push notifications disabled`);
  }
})();

// ── Public API ────────────────────────────────────────────────────────────────

export const pushService = {
  /**
   * Send a push notification to a single FCM token.
   */
  async sendToUser(fcmToken: string, title: string, body: string, data?: Record<string, string>) {
    if (!fcmToken || !_messaging) return null;
    try {
      const response = await _messaging.send({
        token:        fcmToken,
        notification: { title, body },
        ...(data ? { data } : {}),
      });
      logger.info('[Push] Notification sent', { response });
      return response;
    } catch (err: any) {
      logger.error('[Push] Notification failed', { error: err.message });
      throw err;
    }
  },

  /**
   * Send to multiple tokens (batch — max 500 per call).
   */
  async sendMulticast(fcmTokens: string[], title: string, body: string, data?: Record<string, string>) {
    if (!fcmTokens?.length || !_messaging) return null;
    try {
      const response = await _messaging.sendEachForMulticast({
        tokens:       fcmTokens.slice(0, 500),
        notification: { title, body },
        ...(data ? { data } : {}),
      });
      logger.info(`[Push] Multicast sent: ${response.successCount} ok, ${response.failureCount} failed`);
      return response;
    } catch (err: any) {
      logger.error('[Push] Multicast failed', { error: err.message });
      throw err;
    }
  },

  /** Whether FCM is available in this environment. */
  get isAvailable(): boolean {
    return !!_messaging;
  },
};

export default pushService;
