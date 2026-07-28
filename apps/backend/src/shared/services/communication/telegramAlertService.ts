// @ts-nocheck
'use strict';
/**
 * TelegramAlertService — gửi tin nhắn Telegram qua Bot API.
 *
 * Hỗ trợ 4 loại target:
 *   admin   — TELEGRAM_ADMIN_CHAT_ID  (cảnh báo nội bộ)
 *   channel — TELEGRAM_CHANNEL_ID    (kênh công khai)
 *   group   — TELEGRAM_GROUP_ID      (nhóm cộng đồng)
 *   custom  — truyền chatId tùy ý
 *
 * Config được đọc từ biến môi trường, có thể override bằng DB setting.
 *
 * Sử dụng:
 *   const tg = require('./telegramAlertService');
 *
 *   // Alert admin (như cũ)
 *   await tg.alert('🚨 Rút tiền lớn', { userId: 123 });
 *
 *   // Broadcast ra kênh công khai
 *   await tg.sendToChannel('<b>⚽ Trận đấu bắt đầu!</b>', 'HTML');
 *
 *   // Gửi tới nhóm cộng đồng
 *   await tg.sendToGroup('🎁 Mã quà tặng hôm nay: LKVIP100');
 *
 *   // Gửi thẳng với chatId tùy ý
 *   await tg.sendMessage('-100123456789', 'Hello', 'HTML');
 */
const https  = require('https');
const logger = require('../logger');

// Đọc config từ env (có thể override bằng DB setting trong runtime)
let _config = {
  botToken:    process.env.TELEGRAM_BOT_TOKEN       || '',
  adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID   || '',
  channelId:   process.env.TELEGRAM_CHANNEL_ID      || '',
  groupId:     process.env.TELEGRAM_GROUP_ID        || '',
};

/** Override config từ bên ngoài (gọi sau khi đọc DB settings) */
function reloadConfig(overrides) {
  _config = { ..._config, ...overrides };
}

// Backward-compat aliases
const BOT_TOKEN = () => _config.botToken;
const CHAT_ID   = () => _config.adminChatId;

// Emoji prefix theo level
const LEVEL_EMOJI = {
  HIGH:   '🚨',
  MEDIUM: '⚠️',
  LOW:    'ℹ️',
  OK:     '✅',
};

// ── HTTP POST helper ──────────────────────────────────────────────────────────
function telegramPost(method, body, token) {
  return new Promise((resolve) => {
    const tok = token || _config.botToken;
    if (!tok) return resolve(null);
    const data    = JSON.stringify(body);
    const opts    = {
      hostname: 'api.telegram.org',
      path:     `/bot${tok}/${method}`,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 8000,
    };
    const req = https.request(opts, (res) => {
      let raw = '';
      res.on('data', (c) => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch { resolve(null); }
      });
    });
    req.on('error', (e) => { logger.warn(`[Telegram] request error: ${e.message}`); resolve(null); });
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(data);
    req.end();
  });
}

// ── Format message ────────────────────────────────────────────────────────────
function formatMessage(title, details = {}) {
  const env     = process.env.NODE_ENV || 'development';
  const appName = process.env.APP_NAME  || 'LKVIP';
  const ts      = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  let msg = `*[${appName}]* ${title}\n`;
  msg    += `\`Env: ${env} | ${ts}\`\n`;

  if (Object.keys(details).length) {
    msg += '\n';
    for (const [k, v] of Object.entries(details)) {
      msg += `• *${k}*: \`${v}\`\n`;
    }
  }
  return msg;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Gửi tin nhắn tới một chat_id bất kỳ.
 * @param {string} chatId     — Telegram chat_id / @channel
 * @param {string} text       — nội dung (HTML hoặc plain text)
 * @param {'HTML'|'Markdown'} parseMode
 * @param {string} [token]    — override bot token (mặc định: _config.botToken)
 * @returns {Promise<object|null>} kết quả từ Telegram API
 */
async function sendMessage(chatId, text, parseMode = 'HTML', token = null) {
  if (!_config.botToken && !token) {
    logger.debug('[Telegram] botToken not configured — skipping sendMessage');
    return null;
  }
  if (!chatId) {
    logger.debug('[Telegram] chatId missing — skipping sendMessage');
    return null;
  }
  try {
    const result = await telegramPost('sendMessage', {
      chat_id:    chatId,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: false,
    }, token);
    logger.debug(`[Telegram] Sent to ${chatId}: ${text.slice(0, 60)}`);
    return result;
  } catch (err) {
    logger.warn(`[Telegram] sendMessage failed (${chatId}): ${err.message}`);
    return null;
  }
}

/**
 * Gửi tới kênh công khai (TELEGRAM_CHANNEL_ID).
 * @param {string} text
 * @param {'HTML'|'Markdown'} parseMode
 */
async function sendToChannel(text, parseMode = 'HTML') {
  if (!_config.channelId) {
    logger.debug('[Telegram] TELEGRAM_CHANNEL_ID not configured');
    return null;
  }
  return sendMessage(_config.channelId, text, parseMode);
}

/**
 * Gửi tới nhóm cộng đồng (TELEGRAM_GROUP_ID).
 * @param {string} text
 * @param {'HTML'|'Markdown'} parseMode
 */
async function sendToGroup(text, parseMode = 'HTML') {
  if (!_config.groupId) {
    logger.debug('[Telegram] TELEGRAM_GROUP_ID not configured');
    return null;
  }
  return sendMessage(_config.groupId, text, parseMode);
}

/**
 * Gửi alert cơ bản tới admin chat (backward-compat).
 * @param {string} title
 * @param {object} details
 * @param {string} [chatId] — override (mặc định TELEGRAM_ADMIN_CHAT_ID)
 */
async function alert(title, details = {}, chatId = null) {
  const target = chatId || _config.adminChatId;
  if (!_config.botToken || !target) {
    logger.debug(`[Telegram] Not configured — skipping alert: ${title}`);
    return;
  }
  try {
    const text = formatMessage(title, details);
    await telegramPost('sendMessage', {
      chat_id:    target,
      text,
      parse_mode: 'Markdown',
    });
    logger.debug(`[Telegram] Alert sent: ${title}`);
  } catch (err) {
    logger.warn(`[Telegram] Failed to send alert: ${err.message}`);
  }
}

/**
 * Alert với level (HIGH/MEDIUM/LOW/OK).
 * @param {'HIGH'|'MEDIUM'|'LOW'|'OK'} level
 * @param {string} title
 * @param {object} details
 */
async function alertWithLevel(level, title, details = {}) {
  const emoji = LEVEL_EMOJI[level] || 'ℹ️';
  return alert(`${emoji} [${level}] ${title}`, details);
}

/**
 * Alert khi phát hiện fraud cao.
 * Gọi từ fraudScore() hoặc withdraw worker.
 */
async function alertFraud({ userId, amount, score, project }) {
  return alertWithLevel('HIGH', 'Fraud Detection', {
    'User ID': userId,
    Amount:    amount,
    Score:     `${score}/100`,
    Project:   project || 'unknown',
  });
}

/**
 * Alert khi worker bị lỗi nghiêm trọng.
 */
async function alertWorkerError(workerName, errorMsg) {
  return alertWithLevel('HIGH', `Worker Error: ${workerName}`, {
    Error: String(errorMsg).slice(0, 200),
  });
}

/**
 * Alert nạp/rút lớn bất thường.
 */
async function alertLargeTransaction({ type, userId, amount, project }) {
  return alertWithLevel('MEDIUM', `Large ${type}: ${amount}`, {
    'User ID': userId,
    Project:   project || 'unknown',
  });
}

module.exports = {
  reloadConfig,
  sendMessage,
  sendToChannel,
  sendToGroup,
  alert,
  alertWithLevel,
  alertFraud,
  alertWorkerError,
  alertLargeTransaction,
};
