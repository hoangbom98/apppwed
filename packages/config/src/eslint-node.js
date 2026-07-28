import js from '@eslint/js';
import globals from 'globals';

export const nodeFlatConfig = [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'commonjs',
      },
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      'no-empty': 'error',
      'no-extra-semi': 'error',
    },
    ignores: ['node_modules/', 'dist/', 'build/', 'coverage/', 'prisma/', '**/*.d.ts'],
  },
];
