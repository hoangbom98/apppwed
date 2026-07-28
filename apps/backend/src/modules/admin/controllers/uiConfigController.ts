/**
 * uiConfigController.js
 * Admin CRUD for per-project UI / branding / social / feature configs
 * stored in the ProjectConfig table (admin_db).
 *
 * Routes:
 *   GET  /admin/ui-config?project=hub&module=general&group=brand
 *   PUT  /admin/ui-config  { project, updates: [{module,group,key,value,type?,description?}] }
 *   POST /admin/ui-config/create  { project, module, group, key, value, type, description }
 *   DELETE /admin/ui-config/:id
 */
const { success, error } = require('../../../shared/utils/network/response');

/**
 * GET /admin/ui-config
 * Query params: project, module (optional), group (optional)
 */
exports.getAll = async (req, res) => {
  try {
    const { project, module: mod, group } = req.query;

    // No project filter → return all ProjectConfig rows (used by legacy Config.jsx)
    if (!project) {
      const all = await req.prisma.projectConfig.findMany({
        where:   { status: 'active' },
        orderBy: [{ projectCode: 'asc' }, { module: 'asc' }, { group: 'asc' }, { key: 'asc' }],
      });
      return success(res, all);
    }

    const configs = await req.configService.getProjectConfigsFull(project, mod || null, group || null);
    return success(res, configs);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * PUT /admin/ui-config
 * Body: { project, updates: [{module, group, key, value, type?, description?}] }
 * Bulk upsert — xóa cache sau khi lưu.
 */
exports.bulkUpdate = async (req, res) => {
  try {
    const { project, updates } = req.body;
    if (!Array.isArray(updates) || !updates.length) return error(res, 'updates phải là mảng không rỗng', 400);

    // Legacy Config.jsx passes individual updates without a top-level project.
    // In that case each update item must carry its own projectCode field.
    if (!project) {
      for (const item of updates) {
        const pc = item.projectCode;
        if (!pc) return error(res, 'Mỗi update cần có projectCode hoặc truyền project ở body gốc', 400);
        await req.configService.bulkSet(pc, [item]);
      }
      return success(res, null, 'Đã cập nhật cấu hình');
    }

    await req.configService.bulkSet(project, updates);
    return success(res, null, 'Đã cập nhật cấu hình');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * POST /admin/ui-config/create
 * Create a single config entry.
 */
exports.create = async (req, res) => {
  try {
    const { project, module: mod, group, key, value, type = 'string', description, options, isSecret = false } = req.body;
    if (!project || !mod || !group || !key) return error(res, 'project, module, group, key là bắt buộc', 400);

    const record = await req.prisma.projectConfig.create({
      data: { projectCode: project, module: mod, group, key, value, type, description, options, isSecret },
    });
    // Bust cache
    await req.configService.clearCache(project);
    return success(res, record, 'Đã tạo cấu hình');
  } catch (err) {
    if (err.code === 'P2002') return error(res, 'Key đã tồn tại cho dự án/module/group này', 409);
    return error(res, err.message, 500);
  }
};

/**
 * DELETE /admin/ui-config/:id
 */
exports.remove = async (req, res) => {
  try {
    const record = await req.prisma.projectConfig.delete({ where: { id: req.params.id } });
    await req.configService.clearCache(record.projectCode);
    return success(res, null, 'Đã xóa cấu hình');
  } catch (err) {
    return error(res, err.message, 500);
  }
};
