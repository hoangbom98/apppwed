// @ts-nocheck
'use strict';
/**
 * alertHelper — gửi cảnh báo qua Telegram + ghi log.
 *
 * Cấu hình môi trường:
 *   TELEGRAM_BOT_TOKEN  – bot token từ @BotFather
 *   TELEGRAM_CHAT_ID    – chat id (admin group hoặc channel)
 *   SLACK_WEBHOOK_URL   – Slack incoming webhook (tùy chọn)
 *
 * Severity levels: 'low' | 'medium' | 'high' | 'critical'
 */
const https  = require('https');
const logger = require('../shared/services/logger');

// ── Severity emoji prefix ────────────────────────────────────────────────────
const PREFIX = {
  low:      '🔵',
  medium:   '🟡',
  high:     '🔴',
  critical: '🚨',
};

/**
 * Gửi cảnh báo qua Telegram (non-blocking, best-effort).
 * Gracefully no-ops if env vars are not set.
 *
 * @param {string} message   – plain text message
 * @param {string} severity  – 'low'|'medium'|'high'|'critical'
 * @param {object} [extra]   – optional extra data to append (JSON-stringified)
 */
async function sendAlert(message, severity = 'medium', extra = null) {
  const emoji = PREFIX[severity] || '🔔';
  let text = `${emoji} *RISK ALERT* [${severity.toUpperCase()}]\n\n${message}`;

  if (extra) {
    text += `\n\`\`\`\n${JSON.stringify(extra, null, 2).substring(0, 1000)}\n\`\`\``;
  }

  text += `\n\n_${new Date().toISOString()}_`;

  // ── Telegram ─────────────────────────────────────────────────────────────
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (token && chatId) {
    _postTelegram(token, chatId, text).catch(err =>
      logger.warn(`[alertHelper] Telegram send failed: ${err.message}`)
    );
  }

  // ── Slack (optional) ─────────────────────────────────────────────────────
  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (slackUrl) {
    _postSlack(slackUrl, text).catch(err =>
      logger.warn(`[alertHelper] Slack send failed: ${err.message}`)
    );
  }

  // Always log locally
  logger.warn(`[RISK ALERT][${severity}] ${message}`);
}

function _postTelegram(token, chatId, text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      chat_id:    chatId,
      text,
      parse_mode: 'Markdown',
    });

    const options = {
      hostname: 'api.telegram.org',
      path:     `/bot${token}/sendMessage`,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      res.resume();
      if (res.statusCode >= 200 && res.statusCode < 300) resolve();
      else reject(new Error(`Telegram HTTP ${res.statusCode}`));
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('Telegram timeout')); });
    req.write(body);
    req.end();
  });
}

function _postSlack(webhookUrl, text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ text: text.replace(/\*/g, '*').replace(/_/g, '_') });
    const url  = new URL(webhookUrl);

    const options = {
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      res.resume();
      if (res.statusCode >= 200 && res.statusCode < 300) resolve();
      else reject(new Error(`Slack HTTP ${res.statusCode}`));
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('Slack timeout')); });
    req.write(body);
    req.end();
  });
}

module.exports = { sendAlert };
