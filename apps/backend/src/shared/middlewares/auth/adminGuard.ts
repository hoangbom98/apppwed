/**
 * Admin Guard — blocks non-admin roles from accessing admin routes.
 * Roles sourced from @lkvip/constants (single source of truth).
 */
const { ADMIN_ROLES } = require('@lkvip/constants');
const { forbidden }   = require('../../utils/network/response');

const ADMIN_ROLE_SET = new Set(ADMIN_ROLES);

module.exports = (req, res, next) => {
  if (req.user && ADMIN_ROLE_SET.has(req.user.role)) return next();
  return forbidden(res, 'Cần quyền Admin để truy cập');
};
