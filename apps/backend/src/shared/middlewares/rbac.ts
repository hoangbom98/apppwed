const { forbidden } = require('../utils/response');

const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    return next();
  }
  return forbidden(res, 'Admin access required');
};

const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    return next();
  }
  return forbidden(res, 'Superadmin access required');
};

module.exports = { isAdmin, isSuperAdmin };
