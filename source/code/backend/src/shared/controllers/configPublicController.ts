/**
 * configPublicController.js
 * Public endpoint — returns non-secret ProjectConfig values for the current project.
 * Route: GET /api/shared/config?group=brand
 * Does NOT require authentication.
 */
const { success, error } = require('../utils/response');

exports.getConfigs = async (req, res) => {
  try {
    const projectCode = req.project || 'hub';
    const { group }   = req.query;
    const configs     = await req.configService.getProjectConfigs(projectCode, group || null);
    return success(res, configs);
  } catch (err) {
    return error(res, err.message, 500);
  }
};
