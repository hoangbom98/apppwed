/**
 * .eslintrc.base.js — LKVIP GROUP
 * ─────────────────────────────────
 * Base ESLint config shared by all sub-projects (React/TypeScript/browser).
 *
 * Usage — in each package's eslint.config.js (flat config):
 *   import base from '../../.eslintrc.base.js';  // adjust relative path
 *   export default [...base, { ... project overrides ... }];
 *
 * Or for legacy .eslintrc.js (non-flat):
 *   module.exports = { extends: ['../../.eslintrc.base.js'], ... }
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
    // ── TypeScript ──────────────────────────────────────────────────────────
    '@typescript-eslint/no-explicit-any':       'warn',
    '@typescript-eslint/no-unused-vars':        ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/ban-ts-comment':        'warn',

    // ── React Hooks ─────────────────────────────────────────────────────────
    'react-hooks/rules-of-hooks':  'error',
    'react-hooks/exhaustive-deps': 'warn',

    // ── General ─────────────────────────────────────────────────────────────
    'no-console':   ['warn', { allow: ['warn', 'error'] }],
    'no-debugger':  'error',
    'no-duplicate-imports': 'error',
    'prefer-const': 'warn',
    'eqeqeq':       ['error', 'always', { null: 'ignore' }],
  },

  settings: {
    react: { version: 'detect' },
  },

  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '*.min.js',
    'coverage/',
    '.prisma/',
  ],
};
