// @ts-nocheck
'use strict';
/**
 * Telegram CSKH Bot Worker
 *
 * Xử lý incoming webhook updates từ Telegram bot.
 * Flow:
 *   1. Telegram gửi POST → /webhook/telegram/:secret
 *   2. Express route enqueue message vào BullMQ queue "telegram-bot"
 *   3. Worker này dequeue → tìm auto-reply rule khớp → gửi reply
 *
 * Nếu không khớp rule nào:
 *   - Thử Groq AI (nếu GROQ_API_KEY có cấu hình) để trả lời thông minh
 *   - Fallback: gửi tin nhắn "không hiểu, dùng /help"
 *
 * Auto-reply rule matching:
 *   - Sắp xếp theo priority DESC
 *   - So sánh keyword (plain text, case-insensitive hoặc regex)
 *   - Tăng hitCount sau khi match
 */

const { Worker, Queue } = require('bullmq');
const https             = require('https');
const logger            = require('../../shared/services/logger');
const tg                = require('../../shared/services/telegramAlertService');
const cache             = require('../../shared/services/cacheService');
const { getPrismaClient } = require('../../shared/config/databases');

const QUEUE_NAME   = 'telegram-bot';
const CACHE_RULES  = 'telegram_auto_reply_rules'; // Redis cache key
const CACHE_TTL    = 60; // seconds — rules refreshed every 60s

// ── Connection (reuse same Redis config as BullMQ elsewhere) ──────────────────
const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

// ── Queue (export so Express route can enqueue) ────────────────────────────────
const telegramBotQueue = new Queue(QUEUE_NAME, { connection });

// ── Load auto-reply rules (with short cache) ──────────────────────────────────
async function loadRules(prisma) {
  const cached = await cache.get(CACHE_RULES).catch(() => null);
  if (cached) return JSON.parse(cached);

  const rules = await prisma.telegramAutoReply.findMany({
    where:   { isActive: true },
    orderBy: { priority: 'desc' },
  });
  await cache.set(CACHE_RULES, JSON.stringify(rules), CACHE_TTL).catch(() => {});
  return rules;
}

/** Invalidate the rules cache (called after admin saves a rule) */
async function invalidateRulesCache() {
  await cache.del(CACHE_RULES).catch(() => {});
}

// ── Match a message text against rules ────────────────────────────────────────
function matchRule(text, rules) {
  for (const rule of rules) {
    try {
      if (rule.isRegex) {
        const flags = rule.ignoreCase ? 'i' : '';
        const re    = new RegExp(rule.keyword, flags);
        if (re.test(text)) return rule;
      } else {
        const haystack = rule.ignoreCase ? text.toLowerCase() : text;
        const needle   = rule.ignoreCase ? rule.keyword.toLowerCase() : rule.keyword;
        if (haystack.includes(needle)) return rule;
      }
    } catch {
      // bad regex in DB — skip
    }
  }
  return null;
}

// ── Groq AI fallback ──────────────────────────────────────────────────────────
async function groqReply(userText) {
  const key   = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  if (!key) return null;

  return new Promise((resolve) => {
    const body = JSON.stringify({
      model,
      messages: [
        {
          role:    'system',
          content: 'Bạn là trợ lý CSKH của LKVIP — nền tảng giải trí trực tuyến. Trả lời ngắn gọn, thân thiện bằng tiếng Việt. Nếu không biết, hãy đề nghị người dùng liên hệ admin.',
        },
        { role: 'user', content: userText },
      ],
      max_tokens: 200,
    });
    const opts = {
      hostname: 'api.groq.com',
      path:     '/openai/v1/chat/completions',
      method:   'POST',
      headers:  {
        Authorization:    `Bearer ${key}`,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 10000,
    };
    const req = https.request(opts, (res) => {
      let raw = '';
      res.on('data', (c) => raw += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          resolve(json?.choices?.[0]?.message?.content?.trim() || null);
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(body);
    req.end();
  });
}

// ── Worker ────────────────────────────────────────────────────────────────────
function startWorker() {
  const prisma = getPrismaClient('admin');

  const worker = new Worker(QUEUE_NAME, async (job) => {
    const { chatId, text, messageId, username } = job.data;
    if (!chatId || !text) return;

    logger.debug(`[TgBot] Processing message from ${chatId}: "${text.slice(0, 80)}"`);

    // ── Slash commands ───────────────────────────────────────────────────────
    const trimmed = text.trim();

    if (trimmed === '/start' || trimmed.startsWith('/start ')) {
      await tg.sendMessage(chatId,
        '🎉 <b>Chào mừng bạn đến với LKVIP!</b>\n\n' +
        '🎮 Nền tảng giải trí trực tuyến: Game · Sports · Trading · Dating\n\n' +
        '💡 Nhập /help để xem danh sách lệnh hỗ trợ.\n' +
        '🌐 Website: <a href="https://lkvip.group">lkvip.group</a>',
        'HTML');
      return;
    }

    if (trimmed === '/help') {
      await tg.sendMessage(chatId,
        '📋 <b>Danh sách lệnh LKVIP Bot</b>\n\n' +
        '/register — Hướng dẫn đăng ký tài khoản\n' +
        '/deposit  — Hướng dẫn nạp tiền\n' +
        '/withdraw — Hướng dẫn rút tiền\n' +
        '/bonus    — Khuyến mãi đang diễn ra\n' +
        '/support  — Liên hệ hỗ trợ trực tiếp\n\n' +
        'Hoặc nhắn tin mô tả vấn đề, bot sẽ hỗ trợ 24/7 🤖',
        'HTML');
      return;
    }

    if (trimmed === '/register') {
      await tg.sendMessage(chatId,
        '📝 <b>Đăng ký tài khoản LKVIP:</b>\n\n' +
        '1️⃣ Truy cập: <a href="https://lkvip.group/register">lkvip.group/register</a>\n' +
        '2️⃣ Nhập thông tin và mã giới thiệu (nếu có)\n' +
        '3️⃣ Xác nhận email hoặc SĐT\n' +
        '4️⃣ Nhận ngay <b>50,000 VND</b> trải nghiệm! 🎁',
        'HTML');
      return;
    }

    if (trimmed === '/deposit') {
      await tg.sendMessage(chatId,
        '💳 <b>Hướng dẫn nạp tiền:</b>\n\n' +
        '• Chuyển khoản ngân hàng · Momo · ZaloPay · USDT\n' +
        '• Nạp tối thiểu: <b>50,000 VND</b>\n' +
        '• Xử lý trong vòng 2–5 phút\n\n' +
        '🔗 <a href="https://lkvip.group/deposit">lkvip.group/deposit</a>',
        'HTML');
      return;
    }

    if (trimmed === '/withdraw') {
      await tg.sendMessage(chatId,
        '🏦 <b>Hướng dẫn rút tiền:</b>\n\n' +
        '• Rút về ngân hàng, Momo, ZaloPay hoặc USDT\n' +
        '• Rút tối thiểu: <b>100,000 VND</b>\n' +
        '• Thời gian xử lý: 5–30 phút (giờ hành chính)\n\n' +
        '🔗 <a href="https://lkvip.group/withdraw">lkvip.group/withdraw</a>',
        'HTML');
      return;
    }

    if (trimmed === '/bonus') {
      await tg.sendMessage(chatId,
        '🎁 <b>Khuyến mãi hiện tại:</b>\n\n' +
        '🔥 <b>Nạp lần đầu:</b> Bonus 100% — tối đa 500K\n' +
        '💎 <b>VIP Daily:</b> Hoàn tiền 0.5% số dư hàng ngày\n' +
        '🤝 <b>Giới thiệu bạn:</b> Nhận 5% hoa hồng vĩnh viễn\n\n' +
        '📣 Xem thêm: <a href="https://lkvip.group/promotions">lkvip.group/promotions</a>',
        'HTML');
      return;
    }

    if (trimmed === '/support') {
      await tg.sendMessage(chatId,
        '🆘 <b>Liên hệ hỗ trợ:</b>\n\n' +
        '📧 Email: support@lkvip.group\n' +
        '💬 Live chat: <a href="https://lkvip.group/support">lkvip.group/support</a>\n\n' +
        'Đội ngũ hỗ trợ phản hồi trong vòng 5 phút ⚡',
        'HTML');
      return;
    }

    // ── Keyword auto-reply rules ──────────────────────────────────────────────
    const rules   = await loadRules(prisma);
    const matched = matchRule(trimmed, rules);

    if (matched) {
      await tg.sendMessage(chatId, matched.reply, 'HTML');
      // Increment hitCount asynchronously
      prisma.telegramAutoReply.update({
        where: { id: matched.id },
        data:  { hitCount: { increment: 1 } },
      }).catch(() => {});
      logger.debug(`[TgBot] Rule #${matched.id} matched for "${trimmed.slice(0, 40)}"`);
      return;
    }

    // ── Groq AI fallback ──────────────────────────────────────────────────────
    const aiReply = await groqReply(trimmed);
    if (aiReply) {
      await tg.sendMessage(chatId, `🤖 ${aiReply}`, 'HTML');
      return;
    }

    // ── Final fallback ────────────────────────────────────────────────────────
    await tg.sendMessage(chatId,
      '📌 Xin lỗi, tôi chưa hiểu ý bạn.\n' +
      'Vui lòng nhập /help để xem danh sách lệnh, hoặc /support để liên hệ nhân viên.',
      'HTML');
  }, {
    connection,
    concurrency: 5,
  });

  worker.on('failed', (job, err) => {
    logger.error(`[TgBot] Job ${job?.id} failed: ${err.message}`);
  });

  logger.info('[TgBot] Telegram CSKH Bot Worker started');
  return worker;
}

module.exports = { startWorker, telegramBotQueue, invalidateRulesCache };
