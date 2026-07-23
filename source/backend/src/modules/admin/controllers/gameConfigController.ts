// backend/src/modules/admin/controllers/gameConfigController.js
/**
 * Legacy compatibility shim for /admin/game/config routes.
 * The authoritative ProjectConfig CRUD now lives in uiConfigController.js.
 * These handlers delegate to req.configService (bound to admin_db).
 */
const { success, error } = require('../../../shared/utils/response');

/**
 * GET /admin/game/config
 * Returns all ProjectConfig rows, grouped by projectCode.
 */
exports.getAll = async (req, res) => {
  try {
    const rows = await req.prisma.projectConfig.findMany({
      where:   { status: 'active' },
      orderBy: [{ projectCode: 'asc' }, { module: 'asc' }, { group: 'asc' }, { key: 'asc' }],
    });
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * GET /admin/game/config/:project
 * Returns all ProjectConfig rows for one project as a nested module→group→key map.
 */
exports.getByProject = async (req, res) => {
  try {
    const projectCode = req.params.project;
    const configMap = await req.configService.getProjectConfigMap(projectCode);
    if (!Object.keys(configMap).length) return error(res, 'Không tìm thấy cấu hình cho dự án này', 404);
    return success(res, configMap);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * PUT /admin/game/config/:project
 * Bulk upsert config rows for a project.
 * Body: { updates: [{module, group, key, value, type?, description?}] }
 */
exports.update = async (req, res) => {
  const projectCode = req.params.project;
  const { updates } = req.body;

  if (!Array.isArray(updates) || !updates.length) {
    return error(res, 'updates phải là mảng không rỗng', 400);
  }

  try {
    await req.configService.bulkSet(projectCode, updates);
    return success(res, null, 'Đã cập nhật cấu hình');
  } catch (err) {
    return error(res, err.message, 500);
  }
};
