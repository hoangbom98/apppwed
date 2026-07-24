'use strict';
/**
 * @lkvip/constants — Entry point
 * Barrel re-export of all shared constants for the LKVIP platform.
 *
 * Usage:
 *   const { PROJECT_IDS, USER_ROLES, HTTP_STATUS } = require('@lkvip/constants');
 */

const projects   = require('./projects');
const roles      = require('./roles');
const errors     = require('./errors');
const currencies = require('./currencies');

module.exports = {
  ...projects,
  ...roles,
  ...errors,
  ...currencies,
};
