export default {
  // Frontend apps — Oxlint
  'apps/!(backend)/src/**/*.{ts,tsx}': ['oxlint --fix'],
  // Backend — ESLint (warnings are informational; only block on errors)
  'apps/backend/src/**/*.{ts,js}': ['eslint --fix'],
  // Shared packages
  'packages/*/src/**/*.{ts,tsx}': ['oxlint --fix'],
  // Config / docs formatting
  '**/*.{json,md,yml,yaml}': ['prettier --write'],
};
