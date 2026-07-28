// @ts-nocheck
// admin/controllers/cskhController.ts
// REST handlers cho CSKH config API.
// Routes:
//   GET  /admin/cskh/:projectSlug          → getConfig
//   PUT  /admin/cskh/:projectSlug          → upsertConfig
//   GET  /admin/cskh                       → getAllConfigs

const { success, created, error, notFound } = require('../../../shared/utils/network/response');
const CskhService = require('../services/cskhService');

exports.getConfig = async (req, res) => {
  try {
    const svc = new CskhService(req.prisma);
    const config = await svc.getConfig(req.params.projectSlug);
    if (!config) return notFound(res);
    return success(res, config);
  } catch (e) {
    if (e.status === 404) return notFound(res);
    return error(res, e.message, 500);
  }
};

exports.upsertConfig = async (req, res) => {
  try {
    const svc = new CskhService(req.prisma);
    const item = await svc.upsertConfig(req.params.projectSlug, req.body);
    return success(res, item.metadata, 'Đã lưu cấu hình CSKH');
  } catch (e) {
    if (e.status === 404) return notFound(res);
    return error(res, e.message, 500);
  }
};

exports.getAllConfigs = async (req, res) => {
  try {
    const svc = new CskhService(req.prisma);
    const configs = await svc.getAllConfigs();
    return success(res, configs);
  } catch (e) {
    return error(res, e.message, 500);
  }
};
