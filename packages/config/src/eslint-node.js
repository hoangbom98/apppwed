import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

/**
 * nodeFlatConfig — LKVIP GROUP
 * ─────────────────────────────────────────────────────────────────────────────
 * Flat ESLint config cho apps/backend (Node.js TypeScript / ESM).
 *
 * Usage trong apps/backend/eslint.config.js:
 *   import { nodeFlatConfig } from '@lkvip/config/eslint-node';
 *   export default [...nodeFlatConfig, { ... overrides ... }];
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const nodeFlatConfig = [
  js.configs.recommended,
  {
    files: ['**/*.{ts,js,mjs,cjs}'],
    languageOptions: {
      globals:       { ...globals.node },
      parser:        tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType:  'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // ── Must-fix (always error) ──────────────────────────────────────────
      'no-var':               'error',
      'prefer-const':         'error',
      'eqeqeq':              ['error', 'always', { null: 'ignore' }],
      'no-debugger':          'error',
      'no-duplicate-imports': 'error',
      'no-shadow':            'warn',

      // ── Console: backend cho phép .info() ───────────────────────────────
      'no-console':    ['error', { allow: ['warn', 'error', 'info'] }],

      // ── Code quality ────────────────────────────────────────────────────
      'no-empty':      'error',
      'no-extra-semi': 'error',

      // ── TypeScript ───────────────────────────────────────────────────────
      '@typescript-eslint/no-explicit-any':       'error',
      '@typescript-eslint/no-unused-vars':        ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/ban-ts-comment':        'error',
    },
    ignores: ['node_modules/', 'dist/', 'build/', 'coverage/', 'prisma/', '**/*.d.ts'],
  },
];
