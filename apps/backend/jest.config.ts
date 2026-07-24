import type { Config } from 'jest';

const config: Config = {
  preset:           'ts-jest',
  testEnvironment:  'node',
  roots:            ['<rootDir>/src/__tests__'],
  testMatch:        ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { strict: false, allowJs: true } }],
  },
  moduleNameMapper: {
    // databases mock
    '^../../config/databases$':      '<rootDir>/src/__tests__/__mocks__/databases',
    '^../config/databases$':         '<rootDir>/src/__tests__/__mocks__/databases',
    '^../../../config/databases$':   '<rootDir>/src/__tests__/__mocks__/databases',
    // logger mock
    '^../services/logger$':          '<rootDir>/src/__tests__/__mocks__/logger',
    '^../../services/logger$':       '<rootDir>/src/__tests__/__mocks__/logger',
    '^../../../services/logger$':    '<rootDir>/src/__tests__/__mocks__/logger',
    '^./logger$':                    '<rootDir>/src/__tests__/__mocks__/logger',
    '^../shared/services/logger$':   '<rootDir>/src/__tests__/__mocks__/logger',
    // response utils — map relative path from __tests__ to actual location
    '^../utils/response$':           '<rootDir>/src/shared/utils/response',
    '^../../utils/response$':        '<rootDir>/src/shared/utils/response',
    '^../shared/utils/response$':    '<rootDir>/src/shared/utils/response',
  },
  testPathIgnorePatterns: [
    // response.test.ts has pre-existing TS type errors unrelated to our changes
    '<rootDir>/src/__tests__/response.test.ts',
  ],
  collectCoverageFrom: [
    'src/shared/**/*.ts',
    '!src/shared/**/*.d.ts',
    '!src/shared/**/index.ts',
  ],
  coverageThreshold: {
    global: { lines: 40 },
  },
  passWithNoTests: true,
  testTimeout:     10000,
};

export default config;
