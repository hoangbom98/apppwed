import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

/**
 * browserFlatConfig — LKVIP GROUP
 * ─────────────────────────────────────────────────────────────────────────────
 * Flat ESLint config dành cho các gói TypeScript/React frontend (backend dùng
 * nodeFlatConfig từ eslint-node.js).
 *
 * NOTE: Frontend SPAs đã chuyển sang OXLint — file này chỉ còn dùng cho các
 * shared package (shared-types, shared-utils, constants) nếu cần ESLint.
 *
 * Usage trong eslint.config.js của package:
 *   import { browserFlatConfig } from '@lkvip/config/eslint-browser';
 *   export default [...browserFlatConfig, { ... overrides ... }];
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const browserFlatConfig = [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser:        tsParser,
      parserOptions: {
        ecmaVersion:  2022,
        sourceType:   'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks':        reactHooks,
    },
    rules: {
      // ── TypeScript ───────────────────────────────────────────────────────
      '@typescript-eslint/no-explicit-any':       'error',
      '@typescript-eslint/no-unused-vars':        ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/ban-ts-comment':        'error',

      // ── React Hooks ──────────────────────────────────────────────────────
      'react-hooks/rules-of-hooks':  'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ── General ──────────────────────────────────────────────────────────
      'no-unused-vars':       ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console':           ['warn', { allow: ['warn', 'error'] }],
      'no-debugger':          'error',
      'no-duplicate-imports': 'error',
      'no-shadow':            'warn',
      'prefer-const':         'warn',
      'eqeqeq':               ['error', 'always', { null: 'ignore' }],
    },
    ignores: ['node_modules/', 'dist/', 'build/', 'coverage/', 'types/', '**/*.d.ts'],
  },
];
