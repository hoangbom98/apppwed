/**
 * .eslintrc.node.js — LKVIP GROUP
 * ─────────────────────────────────────────────────────────────────────────────
 * Legacy (.eslintrc style) ESLint config cho Node.js / CommonJS backend.
 * TypeScript backend dùng parser @typescript-eslint khi files là .ts.
 *
 * Usage — trong apps/backend/.eslintrc.js:
 *   module.exports = {
 *     extends: ['../../config/eslint/.eslintrc.node.js'],
 *     rules:   { ... project overrides ... }
 *   }
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

module.exports = {
  env: {
    node:   true,
    es2022: true,
  },

  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion: 2022,
    sourceType:  'module',
  },

  plugins: ['@typescript-eslint'],

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],

  rules: {
    // ── Must-fix (always error) ────────────────────────────────────────────
    'no-var':               'error',
    'prefer-const':         'error',
    'eqeqeq':              ['error', 'always', { null: 'ignore' }],
    'no-debugger':          'error',
    'no-duplicate-imports': 'error',
    'no-shadow':            'warn',

    // ── Console: backend cho phép .info() ─────────────────────────────────
    'no-console':     ['error', { allow: ['warn', 'error', 'info'] }],

    // ── Code quality ──────────────────────────────────────────────────────
    'no-empty':      'error',
    'no-extra-semi': 'error',

    // ── TypeScript ────────────────────────────────────────────────────────
    '@typescript-eslint/no-explicit-any':       'error',
    '@typescript-eslint/no-unused-vars':        ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/ban-ts-comment':        'error',

    // ── Off — too noisy on existing patterns ──────────────────────────────
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
