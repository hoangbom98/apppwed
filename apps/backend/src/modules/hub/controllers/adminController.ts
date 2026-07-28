const { success, created, error, notFound } = require('../../../shared/utils/network/response');
const AdminService = require('../services/adminService');

const getAdminService = (req) => new AdminService(req.prisma);

exports.dashboard = async (req, res) => {
  try {
    const data = await getAdminService(req).getDashboardStats();
    return success(res, data);
  } catch (e) { return error(res, e.message, 500); }
};

const makeResource = (modelKey) => ({
  list: async (req, res) => {
    try {
      const data = await getAdminService(req).listResource(modelKey, req.query);
      return res.json({ success: true, ...data });
    } catch (e) { return error(res, e.message, 500); }
  },
  get: async (req, res) => {
    try {
      const item = await getAdminService(req).getResource(modelKey, req.params.id);
      if (!item) return notFound(res);
      return success(res, item);
    } catch (e) { return error(res, e.message, 500); }
  },
  create: async (req, res) => {
    try {
      const item = await getAdminService(req).createResource(modelKey, req.body);
      return created(res, item);
    } catch (e) { return error(res, e.message, 500); }
  },
  update: async (req, res) => {
    try {
      const item = await getAdminService(req).updateResource(modelKey, req.params.id, req.body);
      return success(res, item, 'Updated');
    } catch (e) {
      if (e.code === 'P2025') return notFound(res);
      return error(res, e.message, 500);
    }
  },
  remove: async (req, res) => {
    try {
      await getAdminService(req).deleteResource(modelKey, req.params.id);
      return success(res, null, 'Deleted');
    } catch (e) {
      if (e.code === 'P2025') return notFound(res);
      return error(res, e.message, 500);
    }
  },
});

exports.adminGames      = makeResource('game');
exports.adminCategories = makeResource('category');
exports.adminWebsites   = makeResource('website');
exports.adminTools      = makeResource('tool');
exports.adminNews       = makeResource('news');
exports.adminPages      = makeResource('page');
exports.adminBanners    = makeResource('banner');
exports.adminUsers      = makeResource('user');
exports.adminFeedbacks  = makeResource('feedback');

exports.getSettings = async (req, res) => {
  try {
    const settings = await getAdminService(req).getSettings();
    return success(res, settings);
  } catch (e) { return error(res, e.message, 500); }
};

exports.updateSettings = async (req, res) => {
  try {
    await getAdminService(req).updateSettings(req.body.settings);
    return success(res, null, 'Settings saved');
  } catch (e) { return error(res, e.message, 500); }
};

exports.adminMenus = {
  list: async (req, res) => {
    try { return success(res, await req.prisma.menu.findMany()); } catch (e) { return error(res, e.message, 500); }
  },
  update: async (req, res) => {
    try {
      // Menu has no @unique on `position`, so we use findFirst + upsert by id
      const existing = await req.prisma.menu.findFirst({ where: { position: req.body.position } });
      let menu;
      if (existing) {
        menu = await req.prisma.menu.update({ where: { id: existing.id }, data: { label: req.body.label, url: req.body.url, icon: req.body.icon ?? null, sortOrder: req.body.sortOrder ?? 0 } });
      } else {
        menu = await req.prisma.menu.create({ data: { label: req.body.label, url: req.body.url, icon: req.body.icon ?? null, position: req.body.position || 'header', sortOrder: req.body.sortOrder ?? 0 } });
      }
      return success(res, menu);
    } catch (e) { return error(res, e.message, 500); }
  },
};
