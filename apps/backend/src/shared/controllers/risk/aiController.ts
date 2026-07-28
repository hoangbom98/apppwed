'use strict';
/**
 * shared/controllers/aiController.js
 * Thin pass-through to aiService — used by shared/routes/content/ai.routes.js
 */
const service = require('../services/aiService');
const { ok, error } = require('../utils/response');

exports.getAll = async (req, res) => {
  try {
    const data = await service.getAll(req.prisma);
    return ok(res, data);
  } catch (e) {
    return error(res, e.message, 500);
  }
};
