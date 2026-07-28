import { nodeFlatConfig } from '../../config/eslint/node.flat.js';
import tsParser from '@typescript-eslint/parser';

export default [
  ...nodeFlatConfig,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // Add or override rules here
    },
  },
];
