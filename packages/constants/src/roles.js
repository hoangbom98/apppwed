'use strict';
/**
 * @lkvip/constants — roles.js
 * User roles and permission levels for the LKVIP platform.
 *
 * Role hierarchy (lowest → highest):
 *   user < vip < agent < admin < super_admin
 */

/** @type {string[]} All valid user roles */
const USER_ROLES = ['user', 'vip', 'agent', 'admin', 'super_admin'];

/** @type {string[]} Roles with admin access */
const ADMIN_ROLES = ['admin', 'super_admin'];

/** @type {string[]} Roles with elevated (VIP or above) access */
const ELEVATED_ROLES = ['vip', 'agent', 'admin', 'super_admin'];

/**
 * Numeric permission level per role.
 * Higher number = more permissions.
 * @type {Record<string, number>}
 */
const ROLE_LEVEL = {
  user:        1,
  vip:         2,
  agent:       3,
  admin:       4,
  super_admin: 5,
};

/**
 * Check if a role has admin-level access.
 * @param {string} role
 * @returns {boolean}
 */
function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}

/**
 * Check if roleA has at least the same level as roleB.
 * @param {string} roleA
 * @param {string} roleB
 * @returns {boolean}
 */
function roleAtLeast(roleA, roleB) {
  return (ROLE_LEVEL[roleA] || 0) >= (ROLE_LEVEL[roleB] || 0);
}

module.exports = {
  USER_ROLES,
  ADMIN_ROLES,
  ELEVATED_ROLES,
  ROLE_LEVEL,
  isAdminRole,
  roleAtLeast,
};
