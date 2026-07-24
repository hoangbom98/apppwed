/**
 * source/.eslintrc.node.js
 * ─────────────────────────
 * Base ESLint config cho Node.js / CommonJS projects (backend).
 *
 * Khác với .eslintrc.base.js (React/TypeScript/browser):
 *   - Không dùng TypeScript parser (backend chủ yếu là .js CommonJS)
 *   - Không có React hooks plugin
 *   - Node environment thay vì browser
 *   - ecmaVersion 2021 (CommonJS compat)
 *
 * Usage — trong backend/.eslintrc.js:
 *   module.exports = { extends: ['../../.eslintrc.node.js'], rules: { ... } }
 */

'use strict';

module.exports = {
  env: {
    node:   true,
    es2021: true,
  },

  parserOptions: {
    ecmaVersion: 2021,
    sourceType:  'commonjs',
  },

  extends: ['eslint:recommended'],

  rules: {
    // ── Must-fix (always error) ─────────────────────────────────────────────
    'no-var':       'error',
    'prefer-const': 'error',
    'eqeqeq':       ['error', 'always', { null: 'ignore' }],
    'no-debugger':  'error',
    'no-duplicate-imports': 'error',

    // ── Error (enforced for code quality) ──────────────────────────────────
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-console':     ['error', { allow: ['warn', 'error', 'info'] }],
    'no-empty':       'error',
    'no-extra-semi':  'error',

    // ── Off — too noisy on existing patterns ────────────────────────────────
    'no-prototype-builtins': 'off',
    'no-useless-escape':     'off',
  },

  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    'prisma/',
    '**/*.d.ts',
  ],
};
