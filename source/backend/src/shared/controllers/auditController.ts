'use strict';
/**
 * shared/controllers/auditController.js
 */
const service = require('../services/auditService');
const { ok, error } = require('../utils/response');

exports.getAll = async (req, res) => {
  try {
    const data = await service.getAll(req.prisma);
    return ok(res, data);
  } catch (e) {
    return error(res, e.message, 500);
  }
};
