/**
 * .eslintrc.base.js — LKVIP GROUP
 * ─────────────────────────────────────────────────────────────────────────────
 * Base ESLint config LEGACY (.eslintrc style) — dùng cho backend Node.js/TS.
 *
 * Frontend SPAs dùng OXLint (config/oxlint.json), không dùng file này.
 *
 * Usage — trong apps/backend/.eslintrc.js:
 *   module.exports = { extends: ['../../config/eslint/.eslintrc.base.js'] }
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

module.exports = {
  env: {
    browser: true,
    es2022:  true,
    node:    true,
  },

  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion:  2022,
    sourceType:   'module',
    ecmaFeatures: { jsx: true },
  },

  plugins: ['@typescript-eslint', 'react-hooks'],

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],

  rules: {
    // ── TypeScript ─────────────────────────────────────────────────────────
    '@typescript-eslint/no-explicit-any':       'error',
    '@typescript-eslint/no-unused-vars':        ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/ban-ts-comment':        'error',

    // ── React Hooks (for Hub/Game/etc frontend if this base is reused) ─────
    'react-hooks/rules-of-hooks':  'error',
    'react-hooks/exhaustive-deps': 'warn',

    // ── General ────────────────────────────────────────────────────────────
    'no-console':           ['warn', { allow: ['warn', 'error'] }],
    'no-debugger':          'error',
    'no-duplicate-imports': 'error',
    'no-shadow':            'warn',
    'prefer-const':         'warn',
    'eqeqeq':               ['error', 'always', { null: 'ignore' }],
  },

  settings: {
    react: { version: 'detect' },
  },

  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.min.js',
    '.prisma/',
    '**/*.d.ts',
  ],
};
