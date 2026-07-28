// @ts-nocheck
'use strict';
const { success, error } = require('../../../shared/utils/network/response');
const https = require('https');

const MASKED_VALUE = '[REDACTED]';
const SECRET_KEY_PATTERN = /(pass|password|secret|token|api[_-]?key|private|credential)/i;
const isSecretKey = (key) => SECRET_KEY_PATTERN.test(key || '');
const isMaskedSecretValue = (key, value) => isSecretKey(key) && String(value) === MASKED_VALUE;
const maskSetting = (setting) => setting && isSecretKey(setting.key)
  ? { ...setting, value: setting.value ? MASKED_VALUE : '' }
  : setting;
const maskSettings = (settings) => settings.map(maskSetting);

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Bulk-upsert settings sent as array of { key, value, group? } */
exports.bulkUpsert = async (req, res) => {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings) || settings.length === 0)
      return error(res, 'settings phải là mảng không rỗng', 400);

    const rows = settings
      .filter(item => item?.key && item.value !== undefined && !isMaskedSecretValue(item.key, item.value))
      .map(({ key, value, group = 'integrations', description }) => req.prisma.systemSetting.upsert({
        where:  { key },
        create: { key, value: String(value), group, description },
        update: { value: String(value), ...(description !== undefined && { description }) },
      }));
    const results = await req.prisma.$transaction(rows);
    return success(res, { updated: maskSettings(results) }, 'Đã lưu cấu hình');
  } catch (e) { return error(res, e.message, 500); }
};

// POST /admin/settings/integration-test  { key, value }
exports.testIntegration = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) return error(res, 'Thiếu key hoặc value', 400);

    const strValue = String(value).trim();

    switch (key) {
      // ── Telegram — test bất kỳ bot token (getMe) ────────────────────────────
      case 'TELEGRAM_BOT_TOKEN':
      case 'TELEGRAM_SUPPORT_BOT_TOKEN':
      case 'TELEGRAM_PROMO_BOT_TOKEN': {
        const result = await new Promise((resolve) => {
          const opts = {
            hostname: 'api.telegram.org',
            path:     `/bot${strValue}/getMe`,
            method:   'GET',
            timeout:  5000,
          };
          const r = https.request(opts, (resp) => {
            let raw = '';
            resp.on('data', (c) => raw += c);
            resp.on('end', () => {
              try { resolve(JSON.parse(raw)); } catch { resolve({ ok: false }); }
            });
          });
          r.on('error', () => resolve({ ok: false }));
          r.on('timeout', () => { r.destroy(); resolve({ ok: false }); });
          r.end();
        });
        if (result && result.ok)
          return success(res, { tested: key, username: result.result?.username }, `Bot hợp lệ: @${result.result?.username || 'unknown'}`);
        return error(res, 'Bot Token không hợp lệ hoặc đã bị thu hồi', 400);
      }

      // ── Cloudflare R2 — test S3-compatible HEAD bucket ───────────────────────
      case 'S3_ACCESS_KEY':
      case 'CLOUDFLARE_R2_ACCESS_KEY': {
        // Verify R2 credentials by calling Cloudflare token verify endpoint
        const accountId = req.body.accountId || process.env.S3_ENDPOINT?.match(/([a-f0-9]{32})/)?.[1] || '';
        const apiToken  = req.body.apiToken  || process.env.CLOUDFLARE_API_TOKEN || '';
        if (!apiToken && !accountId) {
          return success(res, { tested: key, skipped: true }, 'Thiếu CLOUDFLARE_API_TOKEN để verify — Key đã lưu');
        }
        const cfResult = await new Promise((resolve) => {
          const opts = {
            hostname: 'api.cloudflare.com',
            path:     `/client/v4/accounts/${accountId}/tokens/verify`,
            method:   'GET',
            headers:  { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
            timeout:  6000,
          };
          const r = https.request(opts, (resp) => {
            let raw = '';
            resp.on('data', (c) => raw += c);
            resp.on('end', () => {
              try { resolve({ status: resp.statusCode, body: JSON.parse(raw) }); }
              catch { resolve({ status: resp.statusCode }); }
            });
          });
          r.on('error', () => resolve({ status: 0 }));
          r.on('timeout', () => { r.destroy(); resolve({ status: 0 }); });
          r.end();
        });
        if (cfResult?.status === 200 && cfResult?.body?.success)
          return success(res, { tested: key }, 'Cloudflare R2 token hợp lệ');
        return error(res, 'Cloudflare R2 token không hợp lệ hoặc đã hết hạn', 400);
      }

      case 'ABUSEIPDB_API_KEY': {
        const testResult = await new Promise((resolve) => {
          const opts = {
            hostname: 'api.abuseipdb.com',
            path:     '/api/v2/check?ipAddress=8.8.8.8&maxAgeInDays=1',
            method:   'GET',
            headers:  { Key: strValue, Accept: 'application/json' },
            timeout:  5000,
          };
          const r = https.request(opts, (resp) => {
            let raw = '';
            resp.on('data', (c) => raw += c);
            resp.on('end', () => {
              try { resolve({ status: resp.statusCode, body: JSON.parse(raw) }); }
              catch { resolve({ status: resp.statusCode }); }
            });
          });
          r.on('error', () => resolve({ status: 0 }));
          r.on('timeout', () => { r.destroy(); resolve({ status: 0 }); });
          r.end();
        });
        if (testResult && testResult.status === 200)
          return success(res, { tested: key }, 'AbuseIPDB API Key hợp lệ');
        return error(res, 'AbuseIPDB API Key không hợp lệ', 400);
      }

      case 'GROQ_API_KEY': {
        const groqResult = await new Promise((resolve) => {
          const body = JSON.stringify({
            model:    'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 1,
          });
          const opts = {
            hostname: 'api.groq.com',
            path:     '/openai/v1/chat/completions',
            method:   'POST',
            headers:  {
              'Authorization': `Bearer ${strValue}`,
              'Content-Type':  'application/json',
              'Content-Length': Buffer.byteLength(body),
            },
            timeout: 8000,
          };
          const r = https.request(opts, (resp) => {
            let raw = '';
            resp.on('data', (c) => raw += c);
            resp.on('end', () => {
              try { resolve({ status: resp.statusCode }); }
              catch { resolve({ status: resp.statusCode }); }
            });
          });
          r.on('error', () => resolve({ status: 0 }));
          r.on('timeout', () => { r.destroy(); resolve({ status: 0 }); });
          r.write(body);
          r.end();
        });
        if (groqResult && groqResult.status === 200)
          return success(res, { tested: key }, 'Groq API Key hợp lệ');
        return error(res, 'Groq API Key không hợp lệ', 400);
      }

      case 'PERSPECTIVE_API_KEY': {
        const perspResult = await new Promise((resolve) => {
          const body = JSON.stringify({
            comment: { text: 'hello' },
            languages: ['en'],
            requestedAttributes: { TOXICITY: {} },
          });
          const path = `/v1alpha1/comments:analyze?key=${encodeURIComponent(strValue)}`;
          const opts = {
            hostname: 'commentanalyzer.googleapis.com',
            path,
            method:   'POST',
            headers:  {
              'Content-Type':   'application/json',
              'Content-Length': Buffer.byteLength(body),
            },
            timeout: 8000,
          };
          const r = https.request(opts, (resp) => {
            resp.on('data', () => {});
            resp.on('end', () => resolve({ status: resp.statusCode }));
          });
          r.on('error', () => resolve({ status: 0 }));
          r.on('timeout', () => { r.destroy(); resolve({ status: 0 }); });
          r.write(body);
          r.end();
        });
        if (perspResult && perspResult.status === 200)
          return success(res, { tested: key }, 'Perspective API Key hợp lệ');
        return error(res, 'Perspective API Key không hợp lệ', 400);
      }

      case 'COINGECKO_API_KEY': {
        const cgResult = await new Promise((resolve) => {
          const opts = {
            hostname: 'api.coingecko.com',
            path:     `/api/v3/ping?x_cg_demo_api_key=${encodeURIComponent(strValue)}`,
            method:   'GET',
            headers:  { Accept: 'application/json' },
            timeout:  5000,
          };
          const r = https.request(opts, (resp) => {
            resp.on('data', () => {});
            resp.on('end', () => resolve({ status: resp.statusCode }));
          });
          r.on('error', () => resolve({ status: 0 }));
          r.on('timeout', () => { r.destroy(); resolve({ status: 0 }); });
          r.end();
        });
        if (cgResult && cgResult.status === 200)
          return success(res, { tested: key }, 'CoinGecko API Key hợp lệ');
        return error(res, 'CoinGecko API Key không hợp lệ hoặc hết hạn', 400);
      }

      default:
        return success(res, { tested: key, skipped: true }, 'Key đã lưu — không có test tự động cho loại này');
    }
  } catch (e) { return error(res, e.message, 500); }
};

// GET /admin/settings[?group=xxx]
exports.getAll = async (req, res) => {
  try {
    const { group } = req.query;
    const where = group ? { group } : {};
    const settings = await req.prisma.systemSetting.findMany({
      where,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
    return success(res, maskSettings(settings));
  } catch (e) { return error(res, e.message, 500); }
};

// GET /admin/settings/:key
exports.getOne = async (req, res) => {
  try {
    const setting = await req.prisma.systemSetting.findUnique({
      where: { key: req.params.key },
    });
    if (!setting) return error(res, 'Không tìm thấy', 404);
    return success(res, maskSetting(setting));
  } catch (e) { return error(res, e.message, 500); }
};

// PUT /admin/settings/:key  { value }
exports.update = async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) return error(res, 'Thiếu value');
    if (isMaskedSecretValue(req.params.key, value)) {
      const setting = await req.prisma.systemSetting.findUnique({ where: { key: req.params.key } });
      if (!setting) return error(res, 'Không tìm thấy key', 404);
      return success(res, maskSetting(setting), 'Đã lưu cài đặt');
    }
    const setting = await req.prisma.systemSetting.update({
      where: { key: req.params.key },
      data:  { value: String(value) },
    });
    return success(res, maskSetting(setting), 'Đã lưu cài đặt');
  } catch (e) {
    if (e.code === 'P2025') return error(res, 'Không tìm thấy key', 404);
    return error(res, e.message, 500);
  }
};

// POST /admin/settings  { key, value, group, description }
exports.create = async (req, res) => {
  try {
    const { key, value, group = 'general', description } = req.body;
    if (!key || value === undefined) return error(res, 'Thiếu key hoặc value');
    if (isMaskedSecretValue(key, value)) {
      const setting = await req.prisma.systemSetting.findUnique({ where: { key } });
      if (!setting) return error(res, 'Không thể tạo secret từ giá trị đã che', 400);
      return success(res, maskSetting(setting), 'Đã lưu');
    }
    const setting = await req.prisma.systemSetting.upsert({
      where:  { key },
      create: { key, value: String(value), group, description },
      update: { value: String(value), group, description },
    });
    return success(res, maskSetting(setting), 'Đã lưu');
  } catch (e) { return error(res, e.message, 500); }
};

// DELETE /admin/settings/:key
exports.remove = async (req, res) => {
  try {
    await req.prisma.systemSetting.delete({ where: { key: req.params.key } });
    return success(res, null, 'Đã xóa');
  } catch (e) {
    if (e.code === 'P2025') return error(res, 'Không tìm thấy key', 404);
    return error(res, e.message, 500);
  }
};

// Legacy aliases kept for backward compat
exports.getSettings    = exports.getAll;
exports.upsertSettings = exports.create;
exports.deleteSetting  = exports.remove;
