'use strict';

/**
 * backend/.eslintrc.js
 * ──────────────────────
 * Extends source/.eslintrc.node.js (Node/CommonJS base).
 * Adds TypeScript-aware overrides for all .ts files in the backend.
 */

module.exports = {
  extends: ['../.eslintrc.node.js'],

  rules: {
    // Backend-specific JS overrides
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-console':     ['warn', { allow: ['warn', 'error', 'info'] }],
  },

  overrides: [
    {
      // TypeScript source files — use TS parser + plugin
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint'],
      rules: {
        // Let TypeScript compiler enforce these instead of ESLint
        'no-undef':       'off',
        'no-unused-vars': 'off',
        // TypeScript-specific equivalents
        '@typescript-eslint/no-unused-vars': [
          'warn',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/no-explicit-any': 'warn',
        'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      },
    },
  ],
};
