'use strict';

module.exports = {
  env: {
    node:   true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
  },
  rules: {
    // Critical — always error (new and existing code)
    'no-var':                'error',
    'prefer-const':          'error',

    // Warn only — pre-existing codebase has many violations; clean up incrementally
    // TODO: change to 'error' once all violations are fixed
    'no-unused-vars':        ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-console':            'warn',
    'no-empty':              'warn',
    'no-useless-escape':     'warn',
    'no-extra-semi':         'warn',

    // Off — too noisy on existing patterns
    'no-prototype-builtins': 'off',
  },
  ignorePatterns: ['node_modules/', 'coverage/', 'dist/', 'prisma/', '**/*.d.ts'],
};
