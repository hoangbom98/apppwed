'use strict';
/**
 * shared/middlewares/prismaBridge.js
 *
 * No-op compatibility shim.
 *
 * The real `req.prisma` is already injected by `projectResolver` (which runs
 * early in the Express middleware chain for every request).  Any legacy shared
 * route that does `router.use(prismaBridge)` simply gets this pass-through so
 * that `require('../middlewares/prismaBridge')` never throws.
 */

// eslint-disable-next-line no-unused-vars
module.exports = function prismaBridge(req, _res, next) {
  // req.prisma is already set by projectResolver — nothing to do.
  next();
};
