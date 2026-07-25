/**
 * @lkvip/constants — roles.ts
 * User roles and permission levels for the LKVIP platform.
 *
 * Role hierarchy (lowest → highest):
 *   user < vip < agent < admin < super_admin
 */

export type UserRole = 'user' | 'vip' | 'agent' | 'admin' | 'super_admin';

/** All valid user roles */
export const USER_ROLES: readonly UserRole[] = ['user', 'vip', 'agent', 'admin', 'super_admin'];

/** Roles with admin access */
export const ADMIN_ROLES: readonly UserRole[] = ['admin', 'super_admin'];

/** Roles with elevated (VIP or above) access */
export const ELEVATED_ROLES: readonly UserRole[] = ['vip', 'agent', 'admin', 'super_admin'];

/**
 * Numeric permission level per role.
 * Higher number = more permissions.
 */
export const ROLE_LEVEL: Record<UserRole, number> = {
  user:        1,
  vip:         2,
  agent:       3,
  admin:       4,
  super_admin: 5,
};

/**
 * Check if a role has admin-level access.
 */
export function isAdminRole(role: string): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

/**
 * Check if roleA has at least the same level as roleB.
 */
export function roleAtLeast(roleA: string, roleB: string): boolean {
  return (ROLE_LEVEL[roleA as UserRole] ?? 0) >= (ROLE_LEVEL[roleB as UserRole] ?? 0);
}
