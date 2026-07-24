const { success, error } = require('../../../shared/utils/response');

// GET /admin/settings[?group=xxx]
exports.getAll = async (req, res) => {
  try {
    const { group } = req.query;
    const where = group ? { group } : {};
    const settings = await req.prisma.systemSetting.findMany({
      where,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
    return success(res, settings);
  } catch (e) { return error(res, e.message, 500); }
};

// GET /admin/settings/:key
exports.getOne = async (req, res) => {
  try {
    const setting = await req.prisma.systemSetting.findUnique({
      where: { key: req.params.key },
    });
    if (!setting) return error(res, 'Không tìm thấy', 404);
    return success(res, setting);
  } catch (e) { return error(res, e.message, 500); }
};

// PUT /admin/settings/:key  { value }
exports.update = async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) return error(res, 'Thiếu value');
    const setting = await req.prisma.systemSetting.update({
      where: { key: req.params.key },
      data:  { value: String(value) },
    });
    return success(res, setting, 'Đã lưu cài đặt');
  } catch (e) {
    if (e.code === 'P2025') return error(res, 'Không tìm thấy key', 404);
    return error(res, e.message, 500);
  }
};

// POST /admin/settings  { key, value, group, description }
exports.create = async (req, res) => {
  try {
    const { key, value, group = 'general', description } = req.body;
    if (!key || value === undefined) return error(res, 'Thiếu key hoặc value');
    const setting = await req.prisma.systemSetting.upsert({
      where:  { key },
      create: { key, value: String(value), group, description },
      update: { value: String(value), group, description },
    });
    return success(res, setting, 'Đã lưu');
  } catch (e) { return error(res, e.message, 500); }
};

// DELETE /admin/settings/:key
exports.remove = async (req, res) => {
  try {
    await req.prisma.systemSetting.delete({ where: { key: req.params.key } });
    return success(res, null, 'Đã xóa');
  } catch (e) {
    if (e.code === 'P2025') return error(res, 'Không tìm thấy key', 404);
    return error(res, e.message, 500);
  }
};

// Legacy aliases kept for backward compat
exports.getSettings    = exports.getAll;
exports.upsertSettings = exports.create;
exports.deleteSetting  = exports.remove;
