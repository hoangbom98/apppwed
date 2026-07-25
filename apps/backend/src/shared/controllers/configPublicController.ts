/**
 * configPublicController.js
 * Public endpoint — returns non-secret ProjectConfig values for the current project.
 * Route: GET /api/shared/config?group=brand
 * Does NOT require authentication.
 */
const { success, error } = require('../utils/response');
const { PROJECT_IDS } = require('@lkvip/constants');

const VALID_PROJECTS = new Set(PROJECT_IDS);
const VALID_GROUPS = new Set(['brand', 'colors', 'social', 'feature', 'media', 'popups']);

exports.getConfigs = async (req, res) => {
  try {
    const requestedProject = typeof req.query.project === 'string' ? req.query.project : null;
    const projectCode = requestedProject && VALID_PROJECTS.has(requestedProject)
      ? requestedProject
      : req.project || 'hub';
    const group = typeof req.query.group === 'string' ? req.query.group : null;

    if (group && !VALID_GROUPS.has(group)) {
      return error(res, 'Invalid config group', 400);
    }

    const configs = await req.configService.getProjectConfigs(projectCode, group);
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return success(res, configs);
  } catch (err) {
    return error(res, err.message, 500);
  }
};
