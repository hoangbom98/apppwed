// @ts-nocheck
// apps/backend/src/modules/admin/controllers/bannerController.ts
// Smart Banner Editor — CRUD for BannerTemplate + BannerLayer + generate images.
//
// Routes consumed:
//   GET    /admin/banner/templates                  list templates
//   POST   /admin/banner/templates                  create template
//   GET    /admin/banner/templates/:id              get template + layers
//   PUT    /admin/banner/templates/:id              update template meta
//   DELETE /admin/banner/templates/:id              soft-delete (isActive=false)
//
//   POST   /admin/banner/templates/:id/layers       add layer
//   PATCH  /admin/banner/layers/:layerId            update layer
//   DELETE /admin/banner/layers/:layerId            delete layer
//
//   POST   /admin/banner/templates/:id/generate     render single image
//   POST   /admin/banner/templates/:id/batch        render batch from variants[]
//   GET    /admin/banner/templates/:id/images       list generated images
//   DELETE /admin/banner/images/:imageId            deactivate generated image
'use strict';

const { getPrismaClient }          = require('../../../config/databases');
const { success, error, notFound, created, paginate } = require('../../../shared/utils/network/response');
const { renderTemplate }           = require('../services/banner-generator.service');
const { getStorageAdapter }        = require('../../../shared/services/storageAdapter');
const crypto                       = require('crypto');

const MAX_LAYERS          = 20;
const MAX_BATCH_VARIANTS  = 100;

// ── helpers ───────────────────────────────────────────────────────────────────

function hubDb() { return getPrismaClient('hub'); }

/**
 * Persist a rendered buffer to storage and create a GeneratedImage record.
 * @param {object} db         prisma hub client
 * @param {Buffer} buf        rendered image buffer
 * @param {object} template   { id, width, height }
 * @param {object} variant    variantData JSON
 * @param {string} format     png | jpg | webp
 */
async function persistGeneratedImage(db, buf, template, variant, format) {
  const storage    = getStorageAdapter();
  const uid        = crypto.randomBytes(8).toString('hex');
  const filename   = `banners/${template.id}/${Date.now()}_${uid}.${format}`;
  const url        = await storage.upload(buf, filename, `image/${format}`);

  return db.generatedImage.create({
    data: {
      templateId:  template.id,
      url,
      storagePath: filename,
      width:       template.width,
      height:      template.height,
      format,
      variantData: variant || {},
      isActive:    true,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Template CRUD
// ═══════════════════════════════════════════════════════════════════════════

/** GET /admin/banner/templates */
exports.listTemplates = async (req, res) => {
  try {
    const db = hubDb();
    const { page = 1, limit = 20, category, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = { isActive: true };
    if (category) where.category = category;
    if (search)   where.name = { contains: search };

    const [templates, total] = await Promise.all([
      db.bannerTemplate.findMany({
        where,
        skip,
        take:    Number(limit),
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { layers: true, images: true } },
        },
      }),
      db.bannerTemplate.count({ where }),
    ]);

    return paginate(res, templates, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

/** GET /admin/banner/templates/:id */
exports.getTemplate = async (req, res) => {
  try {
    const db = hubDb();
    const tpl = await db.bannerTemplate.findUnique({
      where:   { id: req.params.id },
      include: { layers: { orderBy: { zIndex: 'asc' } } },
    });
    if (!tpl || !tpl.isActive) return notFound(res, 'Template not found');
    return success(res, tpl);
  } catch (e) { return error(res, e.message, 500); }
};

/** POST /admin/banner/templates */
exports.createTemplate = async (req, res) => {
  try {
    const db = hubDb();
    const { name, description, category, width, height, background, layers = [] } = req.body;

    if (!name) return error(res, 'name is required', 400);
    if (layers.length > MAX_LAYERS)
      return error(res, `Max ${MAX_LAYERS} layers per template`, 400);

    const tpl = await db.bannerTemplate.create({
      data: {
        name,
        description: description || null,
        category:    category    || 'card-banner',
        width:       Number(width  || 800),
        height:      Number(height || 400),
        background:  background   || '#1a1a2e',
        layers: {
          create: layers.map((l, i) => ({
            type:   l.type   || 'image',
            name:   l.name   || `Layer ${i + 1}`,
            data:   l.data   || null,
            x:      Number(l.x      || 0),
            y:      Number(l.y      || 0),
            width:  l.width  != null ? Number(l.width)  : null,
            height: l.height != null ? Number(l.height) : null,
            zIndex: Number(l.zIndex || i),
          })),
        },
      },
      include: { layers: { orderBy: { zIndex: 'asc' } } },
    });
    return created(res, tpl, 'Template created');
  } catch (e) { return error(res, e.message, 500); }
};

/** PUT /admin/banner/templates/:id */
exports.updateTemplate = async (req, res) => {
  try {
    const db = hubDb();
    const { id } = req.params;
    const tpl = await db.bannerTemplate.findUnique({ where: { id } });
    if (!tpl || !tpl.isActive) return notFound(res, 'Template not found');

    const { name, description, category, width, height, background } = req.body;
    const patch = {};
    if (name        !== undefined) patch.name        = name;
    if (description !== undefined) patch.description = description;
    if (category    !== undefined) patch.category    = category;
    if (width       !== undefined) patch.width       = Number(width);
    if (height      !== undefined) patch.height      = Number(height);
    if (background  !== undefined) patch.background  = background;

    const updated = await db.bannerTemplate.update({ where: { id }, data: patch });
    return success(res, updated, 'Template updated');
  } catch (e) { return error(res, e.message, 500); }
};

/** DELETE /admin/banner/templates/:id — soft delete */
exports.deleteTemplate = async (req, res) => {
  try {
    const db = hubDb();
    const { id } = req.params;
    const tpl = await db.bannerTemplate.findUnique({ where: { id } });
    if (!tpl) return notFound(res, 'Template not found');
    await db.bannerTemplate.update({ where: { id }, data: { isActive: false } });
    return success(res, { id }, 'Template deactivated');
  } catch (e) { return error(res, e.message, 500); }
};

// ═══════════════════════════════════════════════════════════════════════════
// Layer CRUD
// ═══════════════════════════════════════════════════════════════════════════

/** POST /admin/banner/templates/:id/layers */
exports.addLayer = async (req, res) => {
  try {
    const db  = hubDb();
    const tpl = await db.bannerTemplate.findUnique({
      where:   { id: req.params.id },
      include: { _count: { select: { layers: true } } },
    });
    if (!tpl || !tpl.isActive) return notFound(res, 'Template not found');
    if (tpl._count.layers >= MAX_LAYERS)
      return error(res, `Max ${MAX_LAYERS} layers per template`, 400);

    const { type, name, data, x, y, width, height, zIndex } = req.body;
    if (!type) return error(res, 'type is required', 400);

    const layer = await db.bannerLayer.create({
      data: {
        templateId: req.params.id,
        type,
        name:   name   || type,
        data:   data   || null,
        x:      Number(x      || 0),
        y:      Number(y      || 0),
        width:  width  != null ? Number(width)  : null,
        height: height != null ? Number(height) : null,
        zIndex: Number(zIndex || 0),
      },
    });
    return created(res, layer, 'Layer added');
  } catch (e) { return error(res, e.message, 500); }
};

/** PATCH /admin/banner/layers/:layerId */
exports.updateLayer = async (req, res) => {
  try {
    const db    = hubDb();
    const layer = await db.bannerLayer.findUnique({ where: { id: req.params.layerId } });
    if (!layer) return notFound(res, 'Layer not found');

    const { name, data, x, y, width, height, zIndex } = req.body;
    const patch = {};
    if (name   !== undefined) patch.name   = name;
    if (data   !== undefined) patch.data   = data;
    if (x      !== undefined) patch.x      = Number(x);
    if (y      !== undefined) patch.y      = Number(y);
    if (width  !== undefined) patch.width  = width != null ? Number(width)  : null;
    if (height !== undefined) patch.height = height != null ? Number(height) : null;
    if (zIndex !== undefined) patch.zIndex = Number(zIndex);

    const updated = await db.bannerLayer.update({ where: { id: req.params.layerId }, data: patch });
    return success(res, updated, 'Layer updated');
  } catch (e) { return error(res, e.message, 500); }
};

/** DELETE /admin/banner/layers/:layerId */
exports.deleteLayer = async (req, res) => {
  try {
    const db    = hubDb();
    const layer = await db.bannerLayer.findUnique({ where: { id: req.params.layerId } });
    if (!layer) return notFound(res, 'Layer not found');
    await db.bannerLayer.delete({ where: { id: req.params.layerId } });
    return success(res, { id: req.params.layerId }, 'Layer deleted');
  } catch (e) { return error(res, e.message, 500); }
};

// ═══════════════════════════════════════════════════════════════════════════
// Image Generation
// ═══════════════════════════════════════════════════════════════════════════

/** POST /admin/banner/templates/:id/generate */
exports.generateImage = async (req, res) => {
  try {
    const db  = hubDb();
    const tpl = await db.bannerTemplate.findUnique({
      where:   { id: req.params.id },
      include: { layers: { orderBy: { zIndex: 'asc' } } },
    });
    if (!tpl || !tpl.isActive) return notFound(res, 'Template not found');

    const { variantData = {}, format = 'png' } = req.body;
    if (!['png', 'jpg', 'webp'].includes(format))
      return error(res, 'format must be png | jpg | webp', 400);

    const buf     = await renderTemplate(tpl, variantData, format);
    const record  = await persistGeneratedImage(db, buf, tpl, variantData, format);
    return success(res, record, 'Image generated');
  } catch (e) { return error(res, e.message, 500); }
};

/** POST /admin/banner/templates/:id/batch */
exports.generateBatch = async (req, res) => {
  try {
    const db  = hubDb();
    const tpl = await db.bannerTemplate.findUnique({
      where:   { id: req.params.id },
      include: { layers: { orderBy: { zIndex: 'asc' } } },
    });
    if (!tpl || !tpl.isActive) return notFound(res, 'Template not found');

    const { variants = [], format = 'png' } = req.body;
    if (!Array.isArray(variants) || variants.length === 0)
      return error(res, 'variants[] must be a non-empty array', 400);
    if (variants.length > MAX_BATCH_VARIANTS)
      return error(res, `Max ${MAX_BATCH_VARIANTS} variants per batch`, 400);

    const results = [];
    for (const variant of variants) {
      try {
        const buf    = await renderTemplate(tpl, variant, format);
        const record = await persistGeneratedImage(db, buf, tpl, variant, format);
        results.push({ success: true, data: record });
      } catch (err) {
        results.push({ success: false, error: err.message, variant });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return success(res, { total: variants.length, successCount, results }, 'Batch complete');
  } catch (e) { return error(res, e.message, 500); }
};

/** GET /admin/banner/templates/:id/images */
exports.listImages = async (req, res) => {
  try {
    const db = hubDb();
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = { templateId: req.params.id, isActive: true };
    const [images, total] = await Promise.all([
      db.generatedImage.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
      }),
      db.generatedImage.count({ where }),
    ]);
    return paginate(res, images, { total, page: Number(page), limit: Number(limit) });
  } catch (e) { return error(res, e.message, 500); }
};

/** DELETE /admin/banner/images/:imageId */
exports.deleteImage = async (req, res) => {
  try {
    const db  = hubDb();
    const img = await db.generatedImage.findUnique({ where: { id: req.params.imageId } });
    if (!img) return notFound(res, 'Image not found');
    await db.generatedImage.update({ where: { id: req.params.imageId }, data: { isActive: false } });
    return success(res, { id: req.params.imageId }, 'Image deactivated');
  } catch (e) { return error(res, e.message, 500); }
};
