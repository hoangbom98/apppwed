// @ts-nocheck
'use strict';
/**
 * socialPostController.ts — Admin CRUD cho Social Posts và Reports.
 *
 * Được tích hợp từ apps/external/social (React Native Social App).
 * Endpoints: /hub/admin/social-posts, /hub/admin/social-reports, /hub/admin/social-stats
 */

const { getPrismaClient } = require('../../../config/databases');
const prisma = () => getPrismaClient('hub');

// ─────────────────────────────────────────────────────────────────────────────
// POSTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /hub/admin/social-posts
 * Query: page, limit, status, search (caption/userId)
 */
async function listPosts(req, res) {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(50, parseInt(req.query.limit) || 20);
  const skip   = (page - 1) * limit;
  const status = req.query.status || undefined;
  const search = req.query.search || undefined;

  const where = {
    ...(status ? { status } : {}),
    ...(search ? {
      OR: [
        { userId:  { contains: search } },
        { caption: { contains: search } },
      ],
    } : {}),
  };

  try {
    const [data, total] = await Promise.all([
      prisma().socialPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma().socialPost.count({ where }),
    ]);
    res.json({ success: true, data, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * GET /hub/admin/social-posts/:id
 */
async function getPost(req, res) {
  try {
    const post = await prisma().socialPost.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { likes: true, reports: true } } },
    });
    if (!post) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * PATCH /hub/admin/social-posts/:id
 * Body (partial): { status }
 */
async function updatePost(req, res) {
  const VALID_STATUSES = ['active', 'hidden', 'removed', 'pending'];
  const { status } = req.body;
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `status must be one of: ${VALID_STATUSES.join(', ')}` } });
  }
  try {
    const post = await prisma().socialPost.update({
      where: { id: req.params.id },
      data:  { ...(status ? { status } : {}) },
    });
    res.json({ success: true, data: post });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * DELETE /hub/admin/social-posts/:id
 */
async function removePost(req, res) {
  try {
    await prisma().socialPost.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /hub/admin/social-reports
 * Query: page, limit, status
 */
async function listReports(req, res) {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;
  const where = req.query.status ? { status: req.query.status } : {};

  try {
    const [data, total] = await Promise.all([
      prisma().socialReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { post: { select: { id: true, caption: true, imageUrl: true, userId: true } } },
      }),
      prisma().socialReport.count({ where }),
    ]);
    res.json({ success: true, data, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * GET /hub/admin/social-reports/:id
 */
async function getReport(req, res) {
  try {
    const report = await prisma().socialReport.findUnique({
      where:   { id: req.params.id },
      include: { post: true },
    });
    if (!report) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Report not found' } });
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * PATCH /hub/admin/social-reports/:id
 * Body: { status, adminNote? }
 */
async function updateReport(req, res) {
  const VALID_STATUSES = ['pending', 'reviewed', 'resolved', 'dismissed'];
  const { status, adminNote } = req.body;
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `status must be one of: ${VALID_STATUSES.join(', ')}` } });
  }
  try {
    const report = await prisma().socialReport.update({
      where: { id: req.params.id },
      data:  {
        ...(status    ? { status }    : {}),
        ...(adminNote ? { adminNote } : {}),
      },
    });
    res.json({ success: true, data: report });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Report not found' } });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * DELETE /hub/admin/social-reports/:id
 */
async function removeReport(req, res) {
  try {
    await prisma().socialReport.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Report not found' } });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /hub/admin/social-stats
 */
async function getStats(req, res) {
  try {
    const [totalPosts, totalLikes, pendingReports, totalUsers] = await Promise.all([
      prisma().socialPost.count(),
      prisma().socialLike.count(),
      prisma().socialReport.count({ where: { status: 'pending' } }),
      prisma().user.count(),
    ]);
    res.json({ success: true, data: { totalPosts, totalLikes, pendingReports, totalUsers } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

module.exports = {
  listPosts, getPost, updatePost, removePost,
  listReports, getReport, updateReport, removeReport,
  getStats,
};
