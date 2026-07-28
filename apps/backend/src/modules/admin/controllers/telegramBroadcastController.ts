// @ts-nocheck
'use strict';
/**
 * Telegram Broadcast & Auto-Reply Controller
 *
 * Routes (all require auth + adminGuard):
 *
 * BROADCAST
 *   GET    /admin/telegram/broadcasts              — danh sách broadcast (paginated)
 *   POST   /admin/telegram/broadcasts              — gửi broadcast mới
 *   POST   /admin/telegram/broadcasts/preview      — preview rendered content (không gửi)
 *   DELETE /admin/telegram/broadcasts/:id          — xóa khỏi log
 *
 * AUTO-REPLY
 *   GET    /admin/telegram/auto-replies            — danh sách rules
 *   POST   /admin/telegram/auto-replies            — tạo rule mới
 *   PATCH  /admin/telegram/auto-replies/:id        — sửa rule
 *   DELETE /admin/telegram/auto-replies/:id        — xóa rule
 *   POST   /admin/telegram/auto-replies/:id/test   — test rule với input
 *
 * BOT CONFIG
 *   GET    /admin/telegram/config                  — đọc config từ SystemSetting
 *   POST   /admin/telegram/config/reload           — reload bot config từ DB vào service
 */

const { success, error, paginate } = require('../../../shared/utils/network/response');
const tg                           = require('../../../shared/services/communication/telegramAlertService');
const logger                       = require('../../../shared/services/core/logger');

// Lazy load worker to avoid circular dependency at startup
let _botWorker = null;
function getBotWorker() {
  if (!_botWorker) {
    try { _botWorker = require('../../workers/telegram-bot.worker'); } catch { _botWorker = null; }
  }
  return _botWorker;
}

// ── Template variable substitution ───────────────────────────────────────────
function renderTemplate(tpl, vars) {
  if (!vars || !Object.keys(vars).length) return tpl;
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v ?? ''));
  }
  return out;
}

// ── Resolve target chatId + bot token ────────────────────────────────────────
// Returns { chatId, botToken } — botToken null means use default TELEGRAM_BOT_TOKEN
async function resolveTarget(prisma, targetName) {
  // key → { chatIdKey, tokenKey }
  const keyMap = {
    channel:  { chatIdKey: 'TELEGRAM_CHANNEL_ID',          tokenKey: null },
    group:    { chatIdKey: 'TELEGRAM_GROUP_ID',             tokenKey: null },
    admin:    { chatIdKey: 'TELEGRAM_ADMIN_CHAT_ID',        tokenKey: null },
    support:  { chatIdKey: 'TELEGRAM_SUPPORT_CHAT_ID',      tokenKey: 'TELEGRAM_SUPPORT_BOT_TOKEN' },
    promo:    { chatIdKey: 'TELEGRAM_PROMO_CHAT_ID',        tokenKey: 'TELEGRAM_PROMO_BOT_TOKEN' },
    agent:    { chatIdKey: 'TELEGRAM_AGENT_BOT_CHAT_ID',    tokenKey: null },
    cskh:     { chatIdKey: 'TELEGRAM_CSKH_USER_ID',         tokenKey: null },
  };

  const entry = keyMap[targetName];
  if (!entry) return { chatId: targetName, botToken: null }; // raw chatId

  const keys = [entry.chatIdKey, entry.tokenKey].filter(Boolean);
  const rows = keys.length
    ? await prisma.systemSetting.findMany({ where: { key: { in: keys } } }).catch(() => [])
    : [];
  const map = rows.reduce((a, r) => { a[r.key] = r.value; return a; }, {});

  const chatId   = map[entry.chatIdKey]   || process.env[entry.chatIdKey]   || null;
  const botToken = entry.tokenKey
    ? (map[entry.tokenKey] || process.env[entry.tokenKey] || null)
    : null;
  return { chatId, botToken };
}

// ════════════════════════════════════════════════════════════════════════════
// BROADCAST
// ════════════════════════════════════════════════════════════════════════════

// GET /admin/telegram/broadcasts?page=1&limit=20&target=channel&status=sent
exports.listBroadcasts = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const skip   = (page - 1) * limit;
    const where  = {};
    if (req.query.target) where.targetName = req.query.target;
    if (req.query.status) where.status     = req.query.status;

    const [total, items] = await Promise.all([
      req.prisma.telegramBroadcast.count({ where }),
      req.prisma.telegramBroadcast.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, targetName: true, target: true, parseMode: true,
          content: true, templateKey: true, variables: true,
          status: true, sentAt: true, error: true, messageId: true,
          scheduledAt: true, createdAt: true, sentBy: true,
        },
      }),
    ]);

    return paginate(res, items, { total, page, limit });
  } catch (e) { return error(res, e.message, 500); }
};

// POST /admin/telegram/broadcasts
// Body: { target: 'channel'|'group'|'admin'|'support'|'promo'|'agent'|'cskh'|chatId, content, parseMode?, templateKey?, variables? }
exports.sendBroadcast = async (req, res) => {
  try {
    const { target = 'channel', content, parseMode = 'HTML', templateKey, variables } = req.body;
    if (!content) return error(res, 'content là bắt buộc', 400);

    const rendered = renderTemplate(content, variables || {});
    const { chatId, botToken } = await resolveTarget(req.prisma, target);

    if (!chatId) {
      return error(res, `Chưa cấu hình chat ID cho target "${target}". Vào Cài đặt → Tích hợp để thêm.`, 422);
    }

    // Persist broadcast record (status = pending)
    const broadcast = await req.prisma.telegramBroadcast.create({
      data: {
        target:      chatId,
        targetName:  target,
        parseMode,
        content:     rendered,
        templateKey: templateKey || null,
        variables:   variables   || null,
        status:      'pending',
        sentBy:      req.user?.id || null,
      },
    });

    // Send immediately — use per-bot token when available
    const result = await tg.sendMessage(chatId, rendered, parseMode, botToken || null);

    if (result && result.ok) {
      await req.prisma.telegramBroadcast.update({
        where: { id: broadcast.id },
        data:  { status: 'sent', sentAt: new Date(), messageId: result.result?.message_id || null },
      });
      logger.info(`[TgBroadcast] Sent #${broadcast.id} to ${target} (${chatId})`);
      return success(res, { id: broadcast.id, messageId: result.result?.message_id }, 'Đã gửi thành công');
    }

    // Telegram returned error
    const errMsg = result?.description || 'Telegram API error';
    await req.prisma.telegramBroadcast.update({
      where: { id: broadcast.id },
      data:  { status: 'failed', error: errMsg },
    });
    return error(res, `Gửi thất bại: ${errMsg}`, 502);
  } catch (e) { return error(res, e.message, 500); }
};

// POST /admin/telegram/broadcasts/preview
// Body: { content, variables? } — trả về content sau khi render biến, không gửi
exports.previewBroadcast = async (req, res) => {
  try {
    const { content, variables } = req.body;
    if (!content) return error(res, 'content là bắt buộc', 400);
    const rendered = renderTemplate(content, variables || {});
    return success(res, { rendered });
  } catch (e) { return error(res, e.message, 500); }
};

// DELETE /admin/telegram/broadcasts/:id
exports.deleteBroadcast = async (req, res) => {
  try {
    await req.prisma.telegramBroadcast.delete({ where: { id: parseInt(req.params.id) } });
    return success(res, null, 'Đã xóa');
  } catch (e) {
    if (e.code === 'P2025') return error(res, 'Không tìm thấy', 404);
    return error(res, e.message, 500);
  }
};

// ════════════════════════════════════════════════════════════════════════════
// AUTO-REPLY RULES
// ════════════════════════════════════════════════════════════════════════════

// GET /admin/telegram/auto-replies?category=support&active=true
exports.listAutoReplies = async (req, res) => {
  try {
    const where = {};
    if (req.query.category) where.category = req.query.category;
    if (req.query.active !== undefined) where.isActive = req.query.active === 'true';

    const items = await req.prisma.telegramAutoReply.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    return success(res, items);
  } catch (e) { return error(res, e.message, 500); }
};

// POST /admin/telegram/auto-replies
exports.createAutoReply = async (req, res) => {
  try {
    const { keyword, reply, category = 'support', isRegex = false, ignoreCase = true, priority = 0, isActive = true } = req.body;
    if (!keyword || !reply) return error(res, 'keyword và reply là bắt buộc', 400);

    // Validate regex if isRegex
    if (isRegex) {
      try { new RegExp(keyword); } catch { return error(res, 'Regex không hợp lệ', 400); }
    }

    const item = await req.prisma.telegramAutoReply.create({
      data: { keyword, reply, category, isRegex, ignoreCase, priority, isActive },
    });

    // Invalidate rules cache so worker picks up immediately
    getBotWorker()?.invalidateRulesCache?.();

    return success(res, item, 'Đã tạo rule');
  } catch (e) { return error(res, e.message, 500); }
};

// PATCH /admin/telegram/auto-replies/:id
exports.updateAutoReply = async (req, res) => {
  try {
    const allowed = ['keyword','reply','category','isRegex','ignoreCase','priority','isActive'];
    const data    = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

    if (data.isRegex && data.keyword) {
      try { new RegExp(data.keyword); } catch { return error(res, 'Regex không hợp lệ', 400); }
    }

    const item = await req.prisma.telegramAutoReply.update({
      where: { id: parseInt(req.params.id) },
      data,
    });

    getBotWorker()?.invalidateRulesCache?.();
    return success(res, item, 'Đã cập nhật');
  } catch (e) {
    if (e.code === 'P2025') return error(res, 'Không tìm thấy', 404);
    return error(res, e.message, 500);
  }
};

// DELETE /admin/telegram/auto-replies/:id
exports.deleteAutoReply = async (req, res) => {
  try {
    await req.prisma.telegramAutoReply.delete({ where: { id: parseInt(req.params.id) } });
    getBotWorker()?.invalidateRulesCache?.();
    return success(res, null, 'Đã xóa');
  } catch (e) {
    if (e.code === 'P2025') return error(res, 'Không tìm thấy', 404);
    return error(res, e.message, 500);
  }
};

// POST /admin/telegram/auto-replies/:id/test
// Body: { text } — simulate matching against a given input, return matched/unmatched + reply preview
exports.testAutoReply = async (req, res) => {
  try {
    const rule = await req.prisma.telegramAutoReply.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!rule) return error(res, 'Không tìm thấy rule', 404);

    const { text = '' } = req.body;
    let matched = false;

    if (rule.isRegex) {
      const flags = rule.ignoreCase ? 'i' : '';
      try { matched = new RegExp(rule.keyword, flags).test(text); } catch { matched = false; }
    } else {
      const h = rule.ignoreCase ? text.toLowerCase() : text;
      const n = rule.ignoreCase ? rule.keyword.toLowerCase() : rule.keyword;
      matched = h.includes(n);
    }

    return success(res, {
      matched,
      keyword: rule.keyword,
      preview: matched ? rule.reply : null,
      message: matched ? '✅ Tin nhắn sẽ kích hoạt rule này' : '❌ Tin nhắn không khớp với rule',
    });
  } catch (e) { return error(res, e.message, 500); }
};

// ════════════════════════════════════════════════════════════════════════════
// BOT CONFIG
// ════════════════════════════════════════════════════════════════════════════

// ── All known Telegram config keys ───────────────────────────────────────────
const TG_CONFIG_KEYS = [
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_ADMIN_CHAT_ID',
  'TELEGRAM_CHANNEL_ID',
  'TELEGRAM_COMMUNITY_CHANNEL_ID',
  'TELEGRAM_GROUP_ID',
  'TELEGRAM_SUPPORT_BOT_TOKEN',
  'TELEGRAM_SUPPORT_CHAT_ID',
  'TELEGRAM_PROMO_BOT_TOKEN',
  'TELEGRAM_PROMO_CHAT_ID',
  'TELEGRAM_CSKH_USER_ID',
  'TELEGRAM_AGENT_BOT_CHAT_ID',
];

// GET /admin/telegram/config
// Trả về trạng thái cấu hình đầy đủ 7 kênh (mask token, expose chatId)
exports.getConfig = async (req, res) => {
  try {
    const rows = await req.prisma.systemSetting.findMany({ where: { key: { in: TG_CONFIG_KEYS } } });
    const map  = rows.reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {});

    // Fallback to env for any key not in DB
    const get = (k) => map[k] || process.env[k] || '';
    const hasToken = (k) => !!get(k);

    return success(res, {
      configured: hasToken('TELEGRAM_BOT_TOKEN'),
      // Bot 1 — Super Bot
      bot1: {
        label:     'Super Bot (@Proxylll_bot)',
        token:     hasToken('TELEGRAM_BOT_TOKEN') ? '***' : '',
        chatId:    get('TELEGRAM_ADMIN_CHAT_ID'),
        configured: hasToken('TELEGRAM_BOT_TOKEN'),
      },
      // Bot 2 — Hỗ Trợ Tài Khoản
      bot2: {
        label:     'Hỗ Trợ Tài Khoản (@Ho_Tro_Bao_Mat_bot)',
        token:     hasToken('TELEGRAM_SUPPORT_BOT_TOKEN') ? '***' : '',
        chatId:    get('TELEGRAM_SUPPORT_CHAT_ID'),
        configured: hasToken('TELEGRAM_SUPPORT_BOT_TOKEN'),
      },
      // Bot 3 — Hỗ Trợ Khuyến Mại
      bot3: {
        label:     'Hỗ Trợ Khuyến Mại (@napthuongcasino_bot)',
        token:     hasToken('TELEGRAM_PROMO_BOT_TOKEN') ? '***' : '',
        chatId:    get('TELEGRAM_PROMO_CHAT_ID'),
        configured: hasToken('TELEGRAM_PROMO_BOT_TOKEN'),
      },
      // Account 4 — CSKH
      acc4: {
        label:    'CSKH (@nhanviendacap)',
        userId:   get('TELEGRAM_CSKH_USER_ID'),
        configured: !!get('TELEGRAM_CSKH_USER_ID'),
      },
      // Bot 6 — Đại Lý
      bot6: {
        label:    'CSKH Đại Lý (@Daily789F)',
        chatId:   get('TELEGRAM_AGENT_BOT_CHAT_ID'),
        configured: !!get('TELEGRAM_AGENT_BOT_CHAT_ID'),
      },
      // Channel 7 — Kênh Cộng Đồng
      ch7: {
        label:    'Kênh Cộng Đồng (@santhuong500)',
        channelId: get('TELEGRAM_CHANNEL_ID'),
        configured: !!get('TELEGRAM_CHANNEL_ID'),
      },
      // Legacy flat fields (backward compat)
      channelId: get('TELEGRAM_CHANNEL_ID'),
      groupId:   get('TELEGRAM_GROUP_ID'),
    });
  } catch (e) { return error(res, e.message, 500); }
};

// POST /admin/telegram/config/reload
// Đọc lại toàn bộ config từ DB → reload telegramAlertService _config
exports.reloadConfig = async (req, res) => {
  try {
    const rows = await req.prisma.systemSetting.findMany({ where: { key: { in: TG_CONFIG_KEYS } } });
    const map  = rows.reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {});
    const get  = (k) => map[k] || process.env[k] || '';

    tg.reloadConfig({
      botToken:           get('TELEGRAM_BOT_TOKEN'),
      adminChatId:        get('TELEGRAM_ADMIN_CHAT_ID'),
      channelId:          get('TELEGRAM_CHANNEL_ID'),
      communityChannelId: get('TELEGRAM_COMMUNITY_CHANNEL_ID'),
      groupId:            get('TELEGRAM_GROUP_ID'),
      supportBotToken:    get('TELEGRAM_SUPPORT_BOT_TOKEN'),
      supportChatId:      get('TELEGRAM_SUPPORT_CHAT_ID'),
      promoBotToken:      get('TELEGRAM_PROMO_BOT_TOKEN'),
      promoChatId:        get('TELEGRAM_PROMO_CHAT_ID'),
      cskhUserId:         get('TELEGRAM_CSKH_USER_ID'),
      agentChatId:        get('TELEGRAM_AGENT_BOT_CHAT_ID'),
    });

    logger.info('[TgBroadcast] Full config reloaded from DB (11 keys)');
    return success(res, null, 'Config đã reload từ DB — thay đổi có hiệu lực ngay');
  } catch (e) { return error(res, e.message, 500); }
};

// POST /admin/telegram/config/test-bot
// Body: { tokenKey } — test bất kỳ bot token key đang lưu trong DB/env
exports.testBotToken = async (req, res) => {
  try {
    const { tokenKey } = req.body;
    const allowedKeys  = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_SUPPORT_BOT_TOKEN', 'TELEGRAM_PROMO_BOT_TOKEN'];
    if (!allowedKeys.includes(tokenKey))
      return error(res, `tokenKey không hợp lệ. Cho phép: ${allowedKeys.join(', ')}`, 400);

    const row   = await req.prisma.systemSetting.findUnique({ where: { key: tokenKey } }).catch(() => null);
    const token = row?.value || process.env[tokenKey] || '';
    if (!token) return error(res, `${tokenKey} chưa được cấu hình`, 422);

    const result = await new Promise((resolve) => {
      const https = require('https');
      const opts  = { hostname: 'api.telegram.org', path: `/bot${token}/getMe`, method: 'GET', timeout: 5000 };
      const r = https.request(opts, (resp) => {
        let raw = '';
        resp.on('data', (c) => raw += c);
        resp.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({ ok: false }); } });
      });
      r.on('error', () => resolve({ ok: false }));
      r.on('timeout', () => { r.destroy(); resolve({ ok: false }); });
      r.end();
    });

    if (result?.ok)
      return success(res, { tokenKey, username: result.result?.username }, `✅ @${result.result?.username} — Bot hợp lệ`);
    return error(res, `${tokenKey}: Token không hợp lệ hoặc bị thu hồi`, 400);
  } catch (e) { return error(res, e.message, 500); }
};
