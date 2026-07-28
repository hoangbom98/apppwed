export default {
  // Frontend apps — Oxlint
  'apps/!(backend)/src/**/*.{ts,tsx}': ['oxlint --fix'],
  // Backend — ESLint
  'apps/backend/src/**/*.{ts,js}': ['eslint --fix --max-warnings=0'],
  // Shared packages
  'packages/*/src/**/*.{ts,tsx}': ['oxlint --fix'],
  // Config / docs formatting
  '**/*.{json,md,yml,yaml}': ['prettier --write'],
};
