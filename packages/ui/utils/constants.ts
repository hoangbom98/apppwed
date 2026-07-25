// @ts-nocheck
// frontend/shared-ui/utils/constants.js
export const PROJECTS = ['hub', 'game', 'trade', 'dating', 'sports'];

export const STATUS = {
  ACTIVE:   'active',
  INACTIVE: 'inactive',
  BANNED:   'banned',
  PENDING:  'pending',
};

export const ROLES = {
  ADMIN: 'admin',
  USER:  'user',
};

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
