// @ts-nocheck
'use strict';
/**
 * prodevsController.ts — Admin CRUD cho ProDevs CLI scaffold tool.
 *
 * Được tích hợp từ apps/external/prodevs (CLI scaffold Node.js với AI).
 * Endpoints: /hub/admin/prodevs/projects, /templates, /ai-config, /stats
 *
 * AI keys được mã hoá AES-256-GCM qua encryptToString / decryptFromString
 * (tái sử dụng ENCRYPTION_KEY từ .env — không lưu plaintext vào DB).
 */

const { getPrismaClient }                        = require('../../../config/databases');
const { encryptToString, decryptFromString }     = require('../../../shared/utils/crypto/encryption');
const prisma = () => getPrismaClient('hub');

// Prefix để nhận biết giá trị đã được mã hoá
const ENC_PREFIX = 'enc:';

/**
 * Mã hoá một API key — trả về chuỗi "enc:iv:tag:data"
 * Nếu key trống hoặc đã mã hoá thì giữ nguyên.
 */
function encryptKey(value: string): string {
  if (!value || value.startsWith(ENC_PREFIX)) return value;
  try {
    return ENC_PREFIX + encryptToString(value);
  } catch {
    return value; // fallback graceful — không crash
  }
}

/**
 * Giải mã một API key — trả về plaintext.
 * Trả về '' nếu giải mã thất bại hoặc key trống.
 */
function decryptKey(value: string): string {
  if (!value) return '';
  if (!value.startsWith(ENC_PREFIX)) return value; // plaintext cũ
  try {
    return decryptFromString(value.slice(ENC_PREFIX.length));
  } catch {
    return ''; // key bị hỏng → trả về rỗng, không crash
  }
}

/**
 * Mã hoá toàn bộ keyStore object trước khi lưu.
 * @param {Record<string,string>} store  — { OPENAI_API_KEY: 'sk-...', ... }
 */
function encryptKeyStore(store: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(store)) {
    result[k] = v ? encryptKey(v) : '';
  }
  return result;
}

/**
 * Trả về danh sách tên provider đã set (không lộ plaintext key).
 */
function getConfiguredProviders(store: Record<string, string> | null): string[] {
  if (!store) return [];
  return Object.keys(store).filter(k => !!store[k]);
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /hub/admin/prodevs/projects
 * Query: page, limit, framework, search
 */
async function listProjects(req, res) {
  const page      = Math.max(1, parseInt(req.query.page)  || 1);
  const limit     = Math.min(50, parseInt(req.query.limit) || 20);
  const skip      = (page - 1) * limit;
  const framework = req.query.framework || undefined;
  const search    = req.query.search    || undefined;

  const where = {
    ...(framework ? { framework } : {}),
    ...(search    ? { name: { contains: search } } : {}),
  };

  try {
    const [data, total] = await Promise.all([
      prisma().prodevsProject.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma().prodevsProject.count({ where }),
    ]);
    res.json({ success: true, data, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * GET /hub/admin/prodevs/projects/:id
 */
async function getProject(req, res) {
  try {
    const project = await prisma().prodevsProject.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * POST /hub/admin/prodevs/projects
 * Body: { name, description?, framework?, database?, authentication?, styling?, storage?, payments?, aiProvider?, setupMode?, packages? }
 */
async function createProject(req, res) {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name is required' } });
  }
  try {
    const project = await prisma().prodevsProject.create({
      data: {
        name:           name.trim(),
        description:    req.body.description    || null,
        framework:      req.body.framework      || 'none',
        database:       req.body.database       || 'none',
        authentication: req.body.authentication || 'none',
        styling:        req.body.styling        || 'none',
        storage:        req.body.storage        || 'none',
        payments:       req.body.payments       || 'none',
        aiProvider:     req.body.aiProvider     || 'none',
        setupMode:      req.body.setupMode      || 'manual',
        packages:       req.body.packages       || null,
        createdByAdmin: req.admin?.id           || null,
      },
    });
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * PUT /hub/admin/prodevs/projects/:id
 */
async function updateProject(req, res) {
  const allowed = ['name', 'description', 'framework', 'database', 'authentication', 'styling', 'storage', 'payments', 'aiProvider', 'setupMode', 'packages'];
  const data = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k)),
  );
  try {
    const project = await prisma().prodevsProject.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: project });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

/**
 * DELETE /hub/admin/prodevs/projects/:id
 */
async function removeProject(req, res) {
  try {
    await prisma().prodevsProject.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

async function listTemplates(req, res) {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;
  const where = req.query.search ? { name: { contains: req.query.search as string } } : {};

  try {
    const [data, total] = await Promise.all([
      prisma().prodevsTemplate.findMany({ where, orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }], skip, take: limit }),
      prisma().prodevsTemplate.count({ where }),
    ]);
    res.json({ success: true, data, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

async function getTemplate(req, res) {
  try {
    const t = await prisma().prodevsTemplate.findUnique({ where: { id: req.params.id } });
    if (!t) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } });
    res.json({ success: true, data: t });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

async function createTemplate(req, res) {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name is required' } });
  try {
    const t = await prisma().prodevsTemplate.create({
      data: {
        name:           name.trim(),
        description:    req.body.description    || null,
        framework:      req.body.framework      || 'none',
        database:       req.body.database       || 'none',
        authentication: req.body.authentication || 'none',
        styling:        req.body.styling        || 'none',
        storage:        req.body.storage        || 'none',
        payments:       req.body.payments       || 'none',
        aiProvider:     req.body.aiProvider     || 'none',
        isActive:       req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
        sortOrder:      Number(req.body.sortOrder) || 0,
      },
    });
    res.status(201).json({ success: true, data: t });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'Template name already exists' } });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

async function updateTemplate(req, res) {
  const allowed = ['name', 'description', 'framework', 'database', 'authentication', 'styling', 'storage', 'payments', 'aiProvider', 'isActive', 'sortOrder'];
  const data = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  try {
    const t = await prisma().prodevsTemplate.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: t });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

async function removeTemplate(req, res) {
  try {
    await prisma().prodevsTemplate.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found' } });
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI CONFIG  — Singleton row (id=1), upsert pattern
// ─────────────────────────────────────────────────────────────────────────────

async function getAIConfig(req, res) {
  try {
    let config = await prisma().prodevsAIConfig.findFirst();
    if (!config) {
      config = await prisma().prodevsAIConfig.create({ data: { defaultProvider: 'openai' } });
    }
    // KHÔNG trả về keyStore (plaintext hay encrypted) — bảo mật API keys
    // Chỉ trả về defaultProvider và danh sách tên provider đã có key
    const configured = getConfiguredProviders(config.keyStore as Record<string, string> | null);
    res.json({
      success: true,
      data: {
        id:                   config.id,
        defaultProvider:      config.defaultProvider,
        configuredProviders:  configured,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

async function updateAIConfig(req, res) {
  const { defaultProvider, ...keys } = req.body;
  try {
    const existing     = await prisma().prodevsAIConfig.findFirst();
    const existingStore = (existing?.keyStore as Record<string, string>) || {};

    // Merge: chỉ update keys được gửi lên và không rỗng
    // Mã hoá AES-256-GCM mỗi key trước khi lưu
    const updatedStore = { ...existingStore };
    for (const [k, v] of Object.entries(keys)) {
      if (typeof v === 'string' && v.trim()) {
        updatedStore[k] = encryptKey(v.trim()); // "enc:iv:tag:data"
      }
    }

    const dbData: any = { keyStore: updatedStore };
    if (defaultProvider) dbData.defaultProvider = defaultProvider;

    const config = existing
      ? await prisma().prodevsAIConfig.update({ where: { id: existing.id }, data: dbData })
      : await prisma().prodevsAIConfig.create({
          data: { defaultProvider: defaultProvider || 'openai', keyStore: updatedStore },
        });

    // Trả về danh sách providers đã configure (không lộ keys)
    const configured = getConfiguredProviders(config.keyStore as Record<string, string> | null);
    res.json({
      success: true,
      data: {
        id:                  config.id,
        defaultProvider:     config.defaultProvider,
        configuredProviders: configured,
        updated:             Object.keys(keys).filter(k => keys[k]),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────

async function getStats(req, res) {
  try {
    const [totalProjects, totalTemplates] = await Promise.all([
      prisma().prodevsProject.count(),
      prisma().prodevsTemplate.count(),
    ]);
    res.json({ success: true, data: { totalProjects, totalTemplates, successfulScaffolds: totalProjects } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

module.exports = {
  // Projects
  listProjects, getProject, createProject, updateProject, removeProject,
  // Templates
  listTemplates, getTemplate, createTemplate, updateTemplate, removeTemplate,
  // AI Config
  getAIConfig, updateAIConfig,
  // Stats
  getStats,
};
