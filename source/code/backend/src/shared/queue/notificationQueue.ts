// @ts-nocheck
'use strict';
/**
 * notificationQueue.ts — Bull-based notification delivery queue.
 *
 * Supports two job types:
 *   type = 'email'     — send via SMTP (DB config → env fallback)
 *   type = 'sms'       — send via SMS gateway
 *   type = 'telegram'  — send via Telegram Bot API (DB config)
 *   type = 'template'  — render a NotificationTemplate row, then deliver via its channel
 *
 * Emits admin:notif_sent socket event after each successful delivery
 * so the admin UI can show real-time notification status.
 */

const Queue       = require('bull');
const { getPrismaClient } = require('../../config/databases');
const ConfigService       = require('../services/configService');
const nodemailer          = require('nodemailer');
const logger              = require('../services/logger');

const notificationQueue = new Queue(
  'notifications',
  process.env.REDIS_URL || 'redis://localhost:6379',
);

// ── Helper: emit admin socket event (fire-and-forget) ─────────────────────────
function emitNotifStatus(channel, type, status) {
  try {
    const { getIo } = require('../../config/socket');
    const io = getIo();
    if (!io) return;
    const payload = { channel, type, status, timestamp: new Date().toISOString() };
    io.to('admin:all').emit('admin:notif_sent', payload);
    const adminNsp = io.of('/admin');
    if (adminNsp) adminNsp.to('admin:all').emit('admin:notif_sent', payload);
  } catch { /* non-critical — never block queue */ }
}

// ── Helper: load SMTP config from DB then env ──────────────────────────────────
async function buildSmtpTransporter(projectCode) {
  try {
    const prisma        = getPrismaClient('admin');
    const configService = new ConfigService(prisma);
    const smtpConfig    = await configService.getModule(projectCode, 'notification').catch(() => ({}));
    if (smtpConfig?.email?.host) {
      return nodemailer.createTransport({
        host:   smtpConfig.email.host,
        port:   smtpConfig.email.port || 587,
        secure: Number(smtpConfig.email.port) === 465,
        auth:   { user: smtpConfig.email.user, pass: smtpConfig.email.pass },
      });
    }
  } catch { /* fall through */ }

  // Fallback: env-based SMTP
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return null;
}

// ── Helper: load Telegram Bot token from DB then env ──────────────────────────
async function getTelegramToken() {
  try {
    const prisma   = getPrismaClient('admin');
    const row      = await prisma.systemSetting.findUnique({ where: { key: 'telegram.bot_token' } });
    if (row?.value && row.value.length > 10) return row.value;
  } catch { /* fall through */ }
  return process.env.TELEGRAM_BOT_TOKEN || null;
}

// ── Helper: send Telegram message ─────────────────────────────────────────────
async function sendTelegram(chatId, text, botToken) {
  const token = botToken || await getTelegramToken();
  if (!token) throw new Error('Telegram bot token not configured');
  const url  = `https://api.telegram.org/bot${token}/sendMessage`;
  const res  = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`Telegram API error: ${json.description}`);
  return json;
}

// ── Template renderer ─────────────────────────────────────────────────────────
function parseTemplate(tpl, vars) {
  let out = tpl;
  for (const [k, v] of Object.entries(vars ?? {})) {
    out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v ?? ''));
  }
  return out;
}

// ── Queue processor ───────────────────────────────────────────────────────────
notificationQueue.process(async (job) => {
  const { projectCode, type, userId, data } = job.data;
  const prisma = getPrismaClient('admin');

  try {
    // ── Type: template — look up NotificationTemplate row and deliver ──────────
    if (type === 'template' && data?.templateType) {
      const tpl = await prisma.notificationTemplate.findUnique({
        where: { type: data.templateType },
      }).catch(() => null);

      if (!tpl || !tpl.isActive) {
        logger.warn(`[NotifQueue] template ${data.templateType} not found or inactive`);
        return;
      }

      const vars    = data.variables ?? {};
      const subject = tpl.subject ? parseTemplate(tpl.subject, vars) : null;
      const content = parseTemplate(tpl.content, vars);
      const logBase = { templateId: tpl.id, content, status: 'sent', sentAt: new Date() };

      if (tpl.channel === 'telegram' || tpl.channel === 'both') {
        const chatId = data.chatId ?? (await prisma.systemSetting.findUnique({ where: { key: 'telegram.chat_id' } }))?.value;
        if (chatId) {
          try {
            await sendTelegram(chatId, content);
            await prisma.notificationLog.create({ data: { ...logBase, channel: 'telegram', subject, recipient: String(chatId) } }).catch(() => {});
            emitNotifStatus('telegram', data.templateType, 'sent');
          } catch (err) {
            await prisma.notificationLog.create({ data: { ...logBase, channel: 'telegram', subject, recipient: String(chatId), status: 'failed', error: err.message } }).catch(() => {});
            emitNotifStatus('telegram', data.templateType, 'failed');
          }
        }
      }

      if ((tpl.channel === 'email' || tpl.channel === 'both') && subject && data.to) {
        const transporter = await buildSmtpTransporter(projectCode);
        if (transporter) {
          try {
            await transporter.sendMail({
              from:    process.env.SMTP_FROM || process.env.SMTP_USER,
              to:      data.to,
              subject,
              html:    content,
            });
            await prisma.notificationLog.create({ data: { ...logBase, channel: 'email', subject, recipient: data.to } }).catch(() => {});
            emitNotifStatus('email', data.templateType, 'sent');
          } catch (err) {
            await prisma.notificationLog.create({ data: { ...logBase, channel: 'email', subject, recipient: data.to, status: 'failed', error: err.message } }).catch(() => {});
            emitNotifStatus('email', data.templateType, 'failed');
          }
        } else {
          logger.warn('[NotifQueue] SMTP not configured — skipping email delivery');
        }
      }
      return;
    }

    // ── Type: email ───────────────────────────────────────────────────────────
    if (type === 'email') {
      const transporter = await buildSmtpTransporter(projectCode);
      if (transporter) {
        await transporter.sendMail({
          from:    process.env.SMTP_FROM || process.env.SMTP_USER,
          to:      data.to,
          subject: data.subject,
          html:    data.html || data.text,
          text:    data.text,
        });
      } else {
        const emailService = require('../services/emailService');
        await emailService.send(data.to, data.subject, data.html || data.text, data.text);
      }
      emitNotifStatus('email', 'direct', 'sent');
    }

    // ── Type: telegram ────────────────────────────────────────────────────────
    if (type === 'telegram') {
      await sendTelegram(data.chatId, data.text);
      emitNotifStatus('telegram', 'direct', 'sent');
    }

    // ── Type: sms ─────────────────────────────────────────────────────────────
    if (type === 'sms') {
      const smsService = require('../services/smsService');
      await smsService.send(data.phone, data.text);
      emitNotifStatus('sms', 'direct', 'sent');
    }

  } catch (err) {
    logger.error(`[NotifQueue] job failed type=${type} userId=${userId}: ${err.message}`);
    throw err; // re-throw so Bull can retry
  }
});

module.exports = notificationQueue;
