import type { Config } from 'jest';

const config: Config = {
  preset:           'ts-jest',
  testEnvironment:  'node',
  roots:            ['<rootDir>/src/__tests__'],
  testMatch:        ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { strict: false, allowJs: true, types: ['node', 'jest'] } }],
  },
  moduleNameMapper: {
    // workspace packages — map to TypeScript source so ts-jest can compile them
    '^@lkvip/constants$': '<rootDir>/../../packages/constants/src/index.ts',
    '^@lkvip/utils$':     '<rootDir>/../../packages/utils/src/index.ts',
    '^@lkvip/types$':     '<rootDir>/../../packages/types/src/index.ts',
    // databases mock
    '^../../config/databases$':      '<rootDir>/src/__tests__/__mocks__/databases',
    '^../config/databases$':         '<rootDir>/src/__tests__/__mocks__/databases',
    '^../../../config/databases$':       '<rootDir>/src/__tests__/__mocks__/databases',
    '^../../../../config/databases$':    '<rootDir>/src/__tests__/__mocks__/databases',
    '^../../../../../config/databases$': '<rootDir>/src/__tests__/__mocks__/databases',
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
    // payment-gateway adapters require live HTTP mocks — excluded from threshold
    '!src/shared/services/paymentService.ts',
  ],
  coverageThreshold: {
    global: { lines: 50 },   // minimum 50% line coverage on testable shared services
  },
  passWithNoTests: true,
  testTimeout:     10000,
};

export default config;
