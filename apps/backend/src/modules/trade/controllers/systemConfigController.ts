// @ts-nocheck
'use strict';
/**
 * systemConfigController — key-value global settings (replaces lc_info)
 *
 * Default keys (group: finance):
 *   cash_start       "09:00"     withdrawal window start (HH:MM)
 *   cash_end         "17:00"     withdrawal window end   (HH:MM)
 *   cash_min         "10"        min withdrawal amount
 *   cash_max         "50000"     max withdrawal amount per request
 *   cash_max_num     "3"         max withdrawal requests per day
 *   cash_day_max     "100000"    max total withdrawal per day
 *   cash_charge      "0.01"      withdrawal fee rate (1%)
 *   min_recharge     "10"        min deposit amount
 *   order_min        "10"        min order amount
 *   order_max        "100000"    max order amount per request
 *   order_max_count  "10"        max open positions per user
 *   order_max_amount "500000"    max total position value per user
 *   order_charge     "0.002"     order fee rate (0.2%)
 *   signin_reward    "5"         daily sign-in reward amount
 *   kyc_reward       "10"        real-name verification reward
 *   news_reward_min  "1"         min news reading reward
 *   news_reward_max  "5"         max news reading reward
 *   news_reward_limit "3"        max news reward per day per user
 */
const { success, error, notFound } = require('../../../shared/utils/network/response');

// ── GET /trade/config (public — readable keys only) ───────────────────────────
exports.getPublicConfig = async (req, res) => {
  try {
    // Only expose safe public keys
    const publicKeys = [
      'cash_start', 'cash_end', 'cash_min', 'cash_max', 'cash_charge',
      'min_recharge', 'order_min', 'order_max', 'order_charge',
      'signin_reward', 'news_reward_min', 'news_reward_max', 'news_reward_limit',
    ];
    const rows = await req.prisma.systemConfig.findMany({
      where: { key: { in: publicKeys } },
    });
    const cfg: Record<string, string> = {};
    rows.forEach((r: any) => { cfg[r.key] = r.value; });
    return success(res, cfg);
  } catch (e: any) { return error(res, e.message, 500); }
};

// ── GET /trade/admin/config ───────────────────────────────────────────────────
exports.listAll = async (req, res) => {
  try {
    const where: any = {};
    if (req.query.group) where.group = req.query.group;
    const rows = await req.prisma.systemConfig.findMany({ where, orderBy: [{ group: 'asc' }, { key: 'asc' }] });
    return success(res, rows);
  } catch (e: any) { return error(res, e.message, 500); }
};

// ── GET /trade/admin/config/:key ──────────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const row = await req.prisma.systemConfig.findUnique({ where: { key: req.params.key } });
    if (!row) return notFound(res, 'Config key not found');
    return success(res, row);
  } catch (e: any) { return error(res, e.message, 500); }
};

// ── PUT /trade/admin/config/:key ──────────────────────────────────────────────
exports.upsert = async (req, res) => {
  try {
    const { value, group, description } = req.body;
    if (value === undefined) return error(res, 'value là bắt buộc', 400);
    const row = await req.prisma.systemConfig.upsert({
      where:  { key: req.params.key },
      update: { value: String(value), ...(group && { group }), ...(description && { description }) },
      create: { key: req.params.key, value: String(value), group: group || 'general', description: description || null },
    });
    return success(res, row, 'Config đã cập nhật');
  } catch (e: any) { return error(res, e.message, 500); }
};

// ── POST /trade/admin/config/bulk ─────────────────────────────────────────────
exports.bulkUpsert = async (req, res) => {
  try {
    const items: { key: string; value: string; group?: string; description?: string }[] = req.body;
    if (!Array.isArray(items) || items.length === 0) return error(res, 'Cần mảng [{key, value}]', 400);
    const ops = items.map((item) =>
      req.prisma.systemConfig.upsert({
        where:  { key: item.key },
        update: { value: String(item.value), ...(item.group && { group: item.group }) },
        create: { key: item.key, value: String(item.value), group: item.group || 'general', description: item.description || null },
      })
    );
    const results = await Promise.all(ops);
    return success(res, results, `Đã cập nhật ${results.length} configs`);
  } catch (e: any) { return error(res, e.message, 500); }
};

// ── DELETE /trade/admin/config/:key ───────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    await req.prisma.systemConfig.delete({ where: { key: req.params.key } });
    return success(res, null, 'Đã xóa config');
  } catch (e: any) { return error(res, e.message, 500); }
};

// ── Helper: get config value with fallback ────────────────────────────────────
exports.getConfigValue = async (prisma: any, key: string, fallback: string): Promise<string> => {
  const row = await prisma.systemConfig.findUnique({ where: { key } });
  return row ? row.value : fallback;
};
