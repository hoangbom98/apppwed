// @ts-nocheck
/* eslint-disable */

'use strict';
const crypto = require('crypto');
const VirtualAccountService = require('../services/virtualAccountService');
const notifSvc = require('../../../shared/services/notificationService');
const logger   = require('../../../shared/services/logger');

/**
 * Verify HMAC-SHA256 signature from webhook payload.
 * Throws 401 if secret is configured but signature is missing/invalid.
 */
function verifyWebhookSignature(payload, signature, secret) {
  if (!secret) return; // signature verification disabled (dev only)
  if (!signature) throw Object.assign(new Error('Missing webhook signature'), { status: 401 });
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const sigBuf   = Buffer.from(signature);
  const expBuf   = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw Object.assign(new Error('Invalid webhook signature'), { status: 401 });
  }
}

// ── POST /lkvip/webhook/deposit ──────────────────────────────────────────────
exports.handleDepositWebhook = async (req, res) => {
  try {
    const { vaNumber, amount, transactionRef, signature } = req.body;

    if (!vaNumber || !amount) {
      return res.status(400).json({ success: false, error: 'Missing vaNumber or amount' });
    }
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    const webhookSecret = process.env.LKVIP_WEBHOOK_SECRET;
    try {
      verifyWebhookSignature(
        JSON.stringify({ vaNumber, amount, transactionRef }),
        signature,
        webhookSecret,
      );
    } catch (sigErr) {
      logger.warn(`[LKvip] Webhook signature mismatch vaNumber=${vaNumber}`);
      return res.status(sigErr.status || 401).json({ success: false, error: sigErr.message });
    }

    const vaService = new VirtualAccountService(req.prisma);
    const result    = await vaService.confirmDeposit(vaNumber, parseFloat(amount), transactionRef);

    notifSvc.sendToUser(result.user.id, 'balance:update', {
      balance:     Number(result.user.balance),
      transaction: result.transaction,
    });
    notifSvc.sendToUser(result.user.id, 'notification', {
      title:   'Nạp tiền thành công',
      content: `${parseFloat(amount).toLocaleString('vi-VN')} VND đã được cộng vào tài khoản`,
    });

    logger.info(`[LKvip] Deposit OK vaNumber=${vaNumber} amount=${amount} userId=${result.user.id}`);
    return res.status(200).json({ success: true, message: 'OK' });
  } catch (err) {
    logger.error(`[LKvip] Deposit webhook error: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /lkvip/webhooks/momo ─────────────────────────────────────────────────
// MoMo IPN callback — credits user balance when MoMo payment confirmed.
exports.handleMomoWebhook = async (req, res) => {
  try {
    const {
      partnerCode, orderId, requestId, amount, resultCode,
      message, extraData, signature,
    } = req.body;

    // MoMo sends resultCode=0 for success
    if (resultCode !== 0) {
      logger.warn(`[LKvip] MoMo IPN non-zero resultCode=${resultCode} orderId=${orderId}`);
      return res.status(200).json({ success: false, message }); // Always 200 to MoMo
    }

    // Verify MoMo HMAC signature
    const momoSecret = process.env.MOMO_SECRET_KEY;
    if (momoSecret) {
      const rawSignature = [
        `accessKey=${process.env.MOMO_ACCESS_KEY}`,
        `amount=${amount}`,
        `extraData=${extraData || ''}`,
        `message=${message}`,
        `orderId=${orderId}`,
        `partnerCode=${partnerCode}`,
        `requestId=${requestId}`,
        `resultCode=${resultCode}`,
      ].join('&');
      const expected = crypto.createHmac('sha256', momoSecret).update(rawSignature).digest('hex');
      if (signature !== expected) {
        logger.warn(`[LKvip] MoMo signature mismatch orderId=${orderId}`);
        return res.status(200).json({ success: false, error: 'Invalid signature' });
      }
    }

    // extraData contains userId encoded as base64 JSON by our deposit initiation
    let userId = null;
    try {
      if (extraData) {
        const decoded = Buffer.from(extraData, 'base64').toString('utf-8');
        userId = JSON.parse(decoded).userId;
      }
    } catch (_) { /* extraData format unknown — skip */ }

    if (!userId) {
      logger.warn(`[LKvip] MoMo IPN missing userId orderId=${orderId}`);
      return res.status(200).json({ success: false, error: 'Cannot resolve user' });
    }

    // Credit user balance
    const depositAmount = parseFloat(amount);
    await req.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data:  { balance: { increment: depositAmount }, totalDepositToday: { increment: depositAmount } },
      });
      await tx.lkvipTransaction.create({
        data: {
          userId,
          type:         'deposit',
          amount:       depositAmount,
          referenceType: 'momo',
          referenceId:  orderId,
          description:  `Nạp tiền MoMo orderId=${orderId}`,
          status:       'completed',
        },
      });
    });

    notifSvc.sendToUser(userId, 'balance:update', { balance: null });
    logger.info(`[LKvip] MoMo IPN OK orderId=${orderId} userId=${userId} amount=${amount}`);
    return res.status(200).json({ success: true, message: 'OK' });
  } catch (err) {
    logger.error(`[LKvip] MoMo webhook error: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
};
