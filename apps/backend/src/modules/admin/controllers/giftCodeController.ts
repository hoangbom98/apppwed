// @ts-nocheck
'use strict';
/**
 * Admin GiftCode Controller
 * Routes: /admin/giftcodes/*
 *
 *   GET    /admin/giftcodes                   — list all gift codes
 *   POST   /admin/giftcodes                   — create a gift code
 *   PATCH  /admin/giftcodes/:id               — update a gift code
 *   GET    /admin/giftcodes/:id/redemptions   — who redeemed this code
 */

const { success, error, created, paginate, notFound } = require('../../../shared/utils/network/response');
const GiftCodeService = require('../../game/services/giftCodeService');

// ── GET /admin/giftcodes ──────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const where = {};
    if (status) where.status = status;
    if (search) where.code = { contains: search };

    const result = await GiftCodeService.list({ skip, take: Number(limit), where });
    return paginate(res, result.data, { total: result.total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /admin/giftcodes ─────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const giftCode = await GiftCodeService.create(req.body);
    return created(res, giftCode, 'Gift code created');
  } catch (e) {
    return error(res, e.message, e.code === 'VALIDATION_ERROR' ? 400 : 500);
  }
};

// ── PATCH /admin/giftcodes/:id ────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const giftCode = await GiftCodeService.update(req.params.id, req.body);
    return success(res, giftCode, 'Gift code updated');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res, 'Gift code not found');
    return error(res, e.message, 500);
  }
};

// ── GET /admin/giftcodes/:id/redemptions ─────────────────────────────────────
exports.getRedemptions = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip   = (Number(page) - 1) * Number(limit);
    const result = await GiftCodeService.getRedemptions(req.params.id, { skip, take: Number(limit) });
    return paginate(res, result.data, { total: result.total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};
