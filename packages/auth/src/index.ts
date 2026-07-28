/**
 * @lkvip/auth — Shared authentication package
 *
 * Exports:
 *  - useAuth          React hook for login/logout/profile
 *  - apiClient        Axios instance with auto token injection + refresh
 *  - TokenManager     Token persistence (localStorage)
 */
export { useAuth } from './useAuth';
export type { AuthUser, AuthState, LoginCredentials } from './useAuth';

export { default as apiClient } from './apiClient';

export { TokenManager } from './TokenManager';
