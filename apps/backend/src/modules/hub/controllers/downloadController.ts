// @ts-nocheck
'use strict';
/**
 * hub/controllers/downloadController.js
 * Manages DownloadItem records (platform app downloads).
 * DB model: DownloadItem (id = CUID string)
 * Fields: id, title, description, platform, downloadUrl, version, fileSize, changelog, downloads, status
 */
const { success, created, error, notFound } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');

exports.list = async (req, res) => {
  try {
    const { page, limit, skip, take } = paginate(req.query.page, req.query.limit);
    const where = { status: 'active' };
    if (req.query.platform) where.platform = req.query.platform;
    if (req.query.q) where.title = { contains: req.query.q };
    const [data, total] = await Promise.all([
      req.prisma.downloadItem.findMany({ where, skip, take, orderBy: { sortOrder: 'asc' } }),
      req.prisma.downloadItem.count({ where }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};

exports.get = async (req, res) => {
  try {
    // Download items have no slug — look up by id
    const item = await req.prisma.downloadItem.findUnique({ where: { id: req.params.id } });
    if (!item) return notFound(res);
    // Increment download counter asynchronously (fire-and-forget)
    req.prisma.downloadItem.update({ where: { id: item.id }, data: { downloads: { increment: 1 } } }).catch(() => {});
    return success(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

exports.create = async (req, res) => {
  try {
    const { title, description, platform, downloadUrl, version, fileSize, changelog } = req.body;
    if (!title || !platform || !downloadUrl) return error(res, 'title, platform and downloadUrl are required', 400);
    const item = await req.prisma.downloadItem.create({
      data: { title, description, platform, downloadUrl, version, fileSize, changelog },
    });
    return created(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

exports.update = async (req, res) => {
  try {
    const { title, description, platform, downloadUrl, version, fileSize, changelog, status, sortOrder } = req.body;
    const item = await req.prisma.downloadItem.update({
      where: { id: req.params.id },
      data:  { title, description, platform, downloadUrl, version, fileSize, changelog, status, sortOrder },
    });
    return success(res, item);
  } catch (e) { return error(res, e.message, 500); }
};

exports.delete = async (req, res) => {
  try {
    await req.prisma.downloadItem.update({
      where: { id: req.params.id },
      data:  { status: 'deleted' },
    });
    return success(res, null, 'Đã xóa');
  } catch (e) { return error(res, e.message, 500); }
};
