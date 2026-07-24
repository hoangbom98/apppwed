// shared-ui/eslint.config.js
// ESLint v9 flat config for shared-ui React components library

import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      'no-unused-vars':   ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console':       ['warn', { allow: ['warn', 'error'] }],
      'prefer-const':     'warn',
      'eqeqeq':           ['error', 'always', { null: 'ignore' }],
      'no-debugger':      'error',
      'no-duplicate-imports': 'error',
    },
    ignores: ['node_modules/', 'dist/', 'types/'],
  },
];
