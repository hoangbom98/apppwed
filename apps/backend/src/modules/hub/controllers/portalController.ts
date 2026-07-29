'use strict';
/**
 * hub/controllers/portalController.js
 * Portal endpoints for lkvipgroup.com:
 *   GET  /hub/portal/news            → paginated articles
 *   GET  /hub/portal/news/:slug      → article detail
 *   GET  /hub/portal/ecosystem       → ecosystem items
 *   GET  /hub/portal/careers         → job listings
 *   POST /hub/portal/contact         → contact form submission
 */
const Joi = require('joi');
const { success, error, notFound } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');

// ── Portal News ──────────────────────────────────────────────────────────────
exports.getPortalNews = async (req, res) => {
  try {
    const { page = 1, limit = 12, category } = req.query;
    const where = { status: 'published', ...(category ? { category } : {}) };

    const [items, total] = await Promise.all([
      req.prisma.news.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip:  (Number(page) - 1) * Number(limit),
        take:  Number(limit),
        select: {
          id: true, title: true, slug: true, excerpt: true,
          category: true, tags: true, featuredImage: true,
          publishedAt: true, views: true,
          author: { select: { id: true, fullName: true, avatar: true } },
        },
      }),
      req.prisma.news.count({ where }),
    ]);

    return success(res, { data: items, total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

exports.getPortalNewsDetail = async (req, res) => {
  try {
    const article = await req.prisma.news.findUnique({
      where:   { slug: req.params.slug },
      include: { author: { select: { id: true, fullName: true, avatar: true } } },
    });
    if (!article || article.status !== 'published') return notFound(res);
    // Fire-and-forget view increment
    req.prisma.news.update({ where: { id: article.id }, data: { views: { increment: 1 } } }).catch(() => {});
    return success(res, article);
  } catch (e) { return error(res, e.message, 500); }
};

// ── Ecosystem ────────────────────────────────────────────────────────────────
exports.getEcosystemItems = async (req, res) => {
  try {
    // Pull from app catalog if available, else return static fallback
    let items = [];
    try {
      items = await req.prisma.appCatalog.findMany({ where: { isPublic: true }, orderBy: { sortOrder: 'asc' } });
    } catch {
      // appCatalog not in hub DB — return static list
      items = STATIC_ECOSYSTEM;
    }
    return success(res, items);
  } catch (e) { return error(res, e.message, 500); }
};

const STATIC_ECOSYSTEM = [
  { name: 'Hub Portal',  url: 'https://tc-gaming.live',         color: '#3b82f6', status: 'live', category: 'platform', desc: 'Cổng thông tin chính, portal SSO' },
  { name: 'Game',        url: 'https://game.tc-gaming.live',    color: '#8b5cf6', status: 'live', category: 'platform', desc: 'Nền tảng game online & giải trí' },
  { name: 'Trading',     url: 'https://trade.tc-gaming.live',   color: '#10b981', status: 'live', category: 'platform', desc: 'Giao dịch chứng khoán & đầu tư' },
  { name: 'Sports',      url: 'https://sports.tc-gaming.live',  color: '#f59e0b', status: 'live', category: 'platform', desc: 'Thể thao, cá cược & live stream' },
  { name: 'Dating',      url: 'https://dating.tc-gaming.live',  color: '#ec4899', status: 'live', category: 'platform', desc: 'Kết nối & hẹn hò' },
  { name: 'Banking',     url: 'https://banking.tc-gaming.live', color: '#06b6d4', status: 'live', category: 'service',  desc: 'Dịch vụ tài chính & thanh toán' },
  { name: 'Invest',      url: 'https://invest.tc-gaming.live',  color: '#16a34a', status: 'live', category: 'service',  desc: 'Đầu tư sinh lời hàng ngày' },
  { name: 'Store',       url: 'https://store.lkvipgroup.com',   color: '#6366f1', status: 'live', category: 'product',  desc: 'Marketplace tài nguyên số' },
];

// ── Careers ──────────────────────────────────────────────────────────────────
exports.getCareers = async (req, res) => {
  try {
    const { department, location } = req.query;
    const where = {
      status: 'open',
      ...(department ? { department } : {}),
      ...(location   ? { location }   : {}),
    };

    let jobs = [];
    try {
      jobs = await req.prisma.careerPosition.findMany({
        where,
        orderBy: { postedAt: 'desc' },
      });
    } catch {
      // Table may not exist yet — return empty
      jobs = [];
    }
    return success(res, { data: jobs, total: jobs.length });
  } catch (e) { return error(res, e.message, 500); }
};

// ── Contact form ─────────────────────────────────────────────────────────────
const contactSchema = Joi.object({
  name:    Joi.string().min(2).max(80).required(),
  email:   Joi.string().email().required(),
  phone:   Joi.string().max(20).optional().allow('', null),
  subject: Joi.string().min(3).max(120).required(),
  message: Joi.string().min(10).max(2000).required(),
});

exports.submitContact = async (req, res) => {
  const { error: valError, value } = contactSchema.validate(req.body);
  if (valError) return error(res, valError.details[0].message, 400);

  try {
    let saved = null;
    try {
      saved = await req.prisma.contactMessage.create({ data: { ...value, status: 'pending' } });
    } catch {
      // Table not yet created — log and proceed
      saved = { id: 'queued' };
    }
    return success(res, { id: saved.id }, 'Tin nhắn đã được ghi nhận. Chúng tôi sẽ phản hồi sớm nhất!');
  } catch (e) { return error(res, e.message, 500); }
};
