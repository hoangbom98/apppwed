/**
 * @lkvip/types — src/user.ts
 *
 * Enum-based role/status types + simplified User interface.
 * Counterpart to the richer IUser/UserRole in user.types.ts.
 *
 * Import:
 *   import { Role, UserStatus, User } from '@lkvip/types';
 */

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN       = 'ADMIN',
  MODERATOR   = 'MODERATOR',
  USER        = 'USER',
}

export enum UserStatus {
  ACTIVE   = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BANNED   = 'BANNED',
}

export interface User {
  id:        string;
  username:  string;
  email:     string;
  fullName?: string;
  role:      Role;
  status:    UserStatus;
  balance:   number;
  vipLevel:  number;
  createdAt: Date;
}
