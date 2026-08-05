// @ts-nocheck
'use strict';
/**
 * socialChannelController.ts — Social-channel CRUD for hub module.
 *
 * Migrated từ apps/external/landing/server (SocialChannel feature).
 * Public endpoint: GET /hub/social-channels  → active channels, sorted by order.
 * Admin endpoints: POST/PATCH/DELETE /hub/admin/social-channels (adminGuard required, see routes).
 */

const { getPrismaClient } = require('../../../config/databases');

const prisma = () => getPrismaClient('hub');

// ── Public ────────────────────────────────────────────────────────────────────

/**
 * GET /hub/social-channels
 * Returns all active channels sorted by `order` ASC.
 */
async function listActive(req, res) {
  try {
    const channels = await prisma().socialChannel.findMany({
      where:   { isActive: true },
      orderBy: { order: 'asc' },
      select:  { id: true, name: true, url: true, icon: true, order: true },
    });
    res.json({ success: true, data: channels });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

// ── Admin ─────────────────────────────────────────────────────────────────────

/**
 * GET /hub/admin/social-channels
 * Returns all channels (including inactive), sorted by order.
 */
async function list(req, res) {
  try {
    const channels = await prisma().socialChannel.findMany({ orderBy: { order: 'asc' } });
    res.json({ success: true, data: channels });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * POST /hub/admin/social-channels
 * Body: { name, url, icon?, isActive?, order? }
 */
async function create(req, res) {
  const { name, url, icon, isActive, order } = req.body;
  if (!name || !url) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name and url are required' } });
  }
  try {
    const channel = await prisma().socialChannel.create({
      data: {
        name,
        url,
        icon:     icon     ?? 'link',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        order:    Number(order) || 0,
      },
    });
    res.status(201).json({ success: true, data: channel });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * PATCH /hub/admin/social-channels/:id
 * Body (partial): { name?, url?, icon?, isActive?, order? }
 */
async function update(req, res) {
  const { id }                          = req.params;
  const { name, url, icon, isActive, order } = req.body;
  try {
    const data: Record<string, any> = {};
    if (name     !== undefined) data.name     = name;
    if (url      !== undefined) data.url      = url;
    if (icon     !== undefined) data.icon     = icon;
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (order    !== undefined) data.order    = Number(order);

    const channel = await prisma().socialChannel.update({ where: { id }, data });
    res.json({ success: true, data: channel });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Channel not found' } });
    }
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * DELETE /hub/admin/social-channels/:id
 */
async function remove(req, res) {
  const { id } = req.params;
  try {
    await prisma().socialChannel.delete({ where: { id } });
    res.json({ success: true, data: null });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Channel not found' } });
    }
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

module.exports = { listActive, list, create, update, remove };
