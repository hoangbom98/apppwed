'use strict';
/**
 * appCatalogController.js — Admin module
 * Manages the app_catalog table in admin_db.
 *
 * Public (via shared config):
 *   GET  /api/hub/app-catalog          — published entries only (hub resolver → admin DB)
 *
 * Admin CRUD (all require auth + adminGuard):
 *   GET    /api/admin/app-catalog        — list all (including unpublished)
 *   GET    /api/admin/app-catalog/:id    — get one
 *   POST   /api/admin/app-catalog        — create
 *   PUT    /api/admin/app-catalog/:id    — update
 *   DELETE /api/admin/app-catalog/:id    — soft-delete (isPublished = false)
 */
const { getPrismaClient } = require('../../../shared/config/databases');
const { ok, created, notFound, error } = require('../../../shared/utils/network/response');

// Helper — always read from admin_db regardless of req.project
function adminPrisma() {
  return getPrismaClient('admin');
}

// ── Public: published entries ──────────────────────────────────────────────
exports.publicList = async (_req, res) => {
  try {
    const prisma = adminPrisma();
    const data   = await prisma.appCatalog.findMany({
      where:   { isPublished: true },
      orderBy: { sortOrder: 'asc' },
    });
    return ok(res, data);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Admin: list all ────────────────────────────────────────────────────────
exports.list = async (_req, res) => {
  try {
    const prisma = adminPrisma();
    const data   = await prisma.appCatalog.findMany({ orderBy: { sortOrder: 'asc' } });
    return ok(res, data);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Admin: get one ─────────────────────────────────────────────────────────
exports.get = async (req, res) => {
  try {
    const prisma = adminPrisma();
    const item   = await prisma.appCatalog.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!item) return notFound(res, 'App không tìm thấy');
    return ok(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Admin: create ──────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const prisma = adminPrisma();
    const {
      appId, name, developer, category, iconUrl, primaryColor,
      rating, reviewsCount, downloads, androidLink, iosLink,
      description, features, isPublished, sortOrder,
    } = req.body;

    if (!appId || !name) return error(res, 'appId và name là bắt buộc', 400);

    const item = await prisma.appCatalog.create({
      data: {
        appId, name, developer, category, iconUrl, primaryColor,
        rating:       rating      !== undefined ? parseFloat(rating) : 5.0,
        reviewsCount, downloads, androidLink, iosLink,
        description,
        features:    features     !== undefined ? features : undefined,
        isPublished: isPublished  !== undefined ? Boolean(isPublished) : true,
        sortOrder:   sortOrder    !== undefined ? parseInt(sortOrder) : 0,
      },
    });
    return created(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Admin: update ──────────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const prisma = adminPrisma();
    const id     = parseInt(req.params.id);

    const existing = await prisma.appCatalog.findUnique({ where: { id } });
    if (!existing) return notFound(res, 'App không tìm thấy');

    const {
      name, developer, category, iconUrl, primaryColor,
      rating, reviewsCount, downloads, androidLink, iosLink,
      description, features, isPublished, sortOrder,
    } = req.body;

    const item = await prisma.appCatalog.update({
      where: { id },
      data: {
        ...(name         !== undefined && { name }),
        ...(developer    !== undefined && { developer }),
        ...(category     !== undefined && { category }),
        ...(iconUrl      !== undefined && { iconUrl }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(rating       !== undefined && { rating: parseFloat(rating) }),
        ...(reviewsCount !== undefined && { reviewsCount }),
        ...(downloads    !== undefined && { downloads }),
        ...(androidLink  !== undefined && { androidLink }),
        ...(iosLink      !== undefined && { iosLink }),
        ...(description  !== undefined && { description }),
        ...(features     !== undefined && { features }),
        ...(isPublished  !== undefined && { isPublished: Boolean(isPublished) }),
        ...(sortOrder    !== undefined && { sortOrder: parseInt(sortOrder) }),
      },
    });
    return ok(res, item, 'Đã cập nhật');
  } catch (e) { return error(res, e.message, 500); }
};

// ── Admin: soft-delete ─────────────────────────────────────────────────────
exports.destroy = async (req, res) => {
  try {
    const prisma = adminPrisma();
    const id     = parseInt(req.params.id);

    const existing = await prisma.appCatalog.findUnique({ where: { id } });
    if (!existing) return notFound(res, 'App không tìm thấy');

    await prisma.appCatalog.update({ where: { id }, data: { isPublished: false } });
    return ok(res, null, 'Đã ẩn ứng dụng');
  } catch (e) { return error(res, e.message, 500); }
};
