// @ts-nocheck
'use strict';
/**
 * inquiryController.ts — Contact / lead inquiry management for hub module.
 *
 * Migrated từ apps/external/landing/server (Inquiry + PublicController.submitInquiry).
 *
 * Public  : POST /hub/inquiry              → Submit a new inquiry (visitor)
 * Admin   : GET  /hub/admin/inquiries      → List all with filters + pagination
 *           GET  /hub/admin/inquiries/:id  → Single inquiry detail
 *           PATCH /hub/admin/inquiries/:id/status → Update status + adminNote
 */

const { getPrismaClient }       = require('../../../config/databases');
const { sendInquiryNotification } = require('../../../shared/services/communication/emailService');
const logger                    = require('../../../shared/services/core/logger');

const prisma = () => getPrismaClient('hub');

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSubmitterIp(req) {
  return (
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    null
  );
}

// ── Public ────────────────────────────────────────────────────────────────────

/**
 * POST /hub/inquiry
 * Body: { name, email, phone?, message, budget?, resourceType?, resourceId?, resourceTitle? }
 */
async function submit(req, res) {
  const { name, email, phone, message, budget, resourceType, resourceId, resourceTitle } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'name, email and message are required' },
    });
  }

  // Basic email format guard
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid email address' },
    });
  }

  try {
    const inquiry = await prisma().inquiry.create({
      data: {
        name:          String(name).trim(),
        email:         String(email).trim().toLowerCase(),
        phone:         phone         ? String(phone).trim()         : null,
        message:       String(message).trim(),
        budget:        budget        ? String(budget).trim()        : null,
        resourceType:  resourceType  ? String(resourceType).trim()  : null,
        resourceId:    resourceId    ? String(resourceId).trim()    : null,
        resourceTitle: resourceTitle ? String(resourceTitle).trim() : null,
        submitterIp:   getSubmitterIp(req),
      },
    });

    // Fire-and-forget admin notification email
    const adminEmail = process.env.ADMIN_INQUIRY_EMAIL || process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendInquiryNotification(adminEmail, { name, email, phone, message, budget, resourceTitle })
        .catch(err => logger.warn(`[Inquiry] Email notification failed: ${err.message}`));
    }

    res.status(201).json({ success: true, data: { id: inquiry.id }, message: 'Yêu cầu đã được gửi thành công' });
  } catch (err) {
    logger.error(`[Inquiry] submit error: ${err.message}`);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

// ── Admin ─────────────────────────────────────────────────────────────────────

/**
 * GET /hub/admin/inquiries
 * Query: status?, email?, page?, limit?
 */
async function list(req, res) {
  const { status, email, page = '1', limit = '20' } = req.query;
  const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Number(limit));
  const take = Math.min(100, Number(limit));

  const where: Record<string, any> = {};
  if (status) where.status = String(status);
  if (email)  where.email  = { contains: String(email), mode: 'insensitive' };

  try {
    const [items, total] = await Promise.all([
      prisma().inquiry.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma().inquiry.count({ where }),
    ]);
    res.json({
      success: true,
      data:    items,
      meta:    { total, page: Number(page), limit: take, pages: Math.ceil(total / take) },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * GET /hub/admin/inquiries/:id
 */
async function get(req, res) {
  try {
    const inquiry = await prisma().inquiry.findUnique({ where: { id: req.params.id } });
    if (!inquiry) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Inquiry not found' } });
    }
    res.json({ success: true, data: inquiry });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * PATCH /hub/admin/inquiries/:id/status
 * Body: { status: 'new'|'in_progress'|'resolved'|'archived', adminNote? }
 */
async function updateStatus(req, res) {
  const { id }                = req.params;
  const { status, adminNote } = req.body;

  const allowed = ['new', 'in_progress', 'resolved', 'archived'];
  if (!status || !allowed.includes(status)) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: `status must be one of: ${allowed.join(', ')}` },
    });
  }

  try {
    const data: Record<string, any> = { status };
    if (adminNote !== undefined) data.adminNote = String(adminNote);

    const inquiry = await prisma().inquiry.update({ where: { id }, data });
    res.json({ success: true, data: inquiry });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Inquiry not found' } });
    }
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

module.exports = { submit, list, get, updateStatus };
