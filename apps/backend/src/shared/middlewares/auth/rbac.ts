const { ADMIN_ROLES } = require('@lkvip/constants');
const { forbidden }   = require('../../utils/network/response');

const ADMIN_ROLE_SET = new Set(ADMIN_ROLES);

/**
 * Passes for 'admin' or 'super_admin'.
 * Consistent with ADMIN_ROLES from @lkvip/constants.
 */
const isAdmin = (req, res, next) => {
  if (req.user && ADMIN_ROLE_SET.has(req.user.role)) return next();
  return forbidden(res, 'Admin access required');
};

/**
 * Passes for 'super_admin' only.
 */
const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'super_admin') return next();
  return forbidden(res, 'Super admin access required');
};

module.exports = { isAdmin, isSuperAdmin };
