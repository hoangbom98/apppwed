// Re-export everything from the canonical authService implementation.
// Kept for backwards compatibility — new code should import from './auth/authService' directly.
export * from './auth/authService';
export { default } from './auth/authService';
