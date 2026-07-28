/**
 * Mock for apps/backend/src/shared/services/auth/riskService.ts
 * Used in unit tests for riskMiddleware — replaced by jest.mock() in each test file.
 */
module.exports = {
  checkDdos:     jest.fn().mockResolvedValue({ blocked: false }),
  checkLocation: jest.fn().mockResolvedValue({ risk: 'low' }),
  scanInput:     jest.fn().mockReturnValue({ detected: false }),
  handleAttack:  jest.fn().mockResolvedValue(undefined),
  detectBot:     jest.fn().mockReturnValue({ isBot: false, confidence: 0 }),
  handleBot:     jest.fn().mockResolvedValue(undefined),
};
