/**
 * Tests for projectAccessGuard middleware.
 * Verifies multi-project token isolation and user status enforcement.
 */

import type { NextFunction } from 'express';

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockFindUnique = jest.fn();

jest.mock('../../config/databases', () => ({
  getPrismaClient: jest.fn().mockReturnValue({
    user: { findUnique: mockFindUnique },
  }),
}));

jest.mock('../services/logger', () => ({
  warn:     jest.fn(),
  error:    jest.fn(),
  security: jest.fn(),
}));

// Import response helpers (resolve after mocks)
let forbidden: jest.Mock, unauthorized: jest.Mock;
jest.mock('../shared/utils/network/response', () => {
  forbidden    = jest.fn();
  unauthorized = jest.fn();
  return { forbidden, unauthorized };
});

// Import SUT after mocks
// eslint-disable-next-line @typescript-eslint/no-var-requires
const projectAccessGuard = require('../shared/middlewares/auth/projectAccessGuard');

// ── Helpers ───────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeReq(overrides: Record<string, any> = {}): any {
  return {
    project:    'game',
    user:       { id: 1, email: 'user@test.com', role: 'user', project: 'game' },
    ip:         '127.0.0.1',
    originalUrl: '/api/game/data',
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeRes(): any {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

const next: NextFunction = jest.fn();

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('projectAccessGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUnique.mockResolvedValue({ id: 1, status: 'active' });
  });

  it('calls next() for valid active user with matching project', async () => {
    const req = makeReq();
    await projectAccessGuard(req, makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(forbidden).not.toHaveBeenCalled();
  });

  it('returns 403 when token.project !== req.project (cross-project attack)', async () => {
    const req = makeReq({
      project: 'trade',
      user: { id: 1, email: 'user@test.com', role: 'user', project: 'game' }, // token says game
    });
    await projectAccessGuard(req, makeRes(), next);
    expect(forbidden).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('skips DB lookup and calls next() for admin project token', async () => {
    const req = makeReq({
      project: 'admin',
      user: { id: 1, email: 'admin@lkvip.com', role: 'super_admin', project: 'admin' },
    });
    await projectAccessGuard(req, makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('returns 403 when user status is banned', async () => {
    mockFindUnique.mockResolvedValue({ id: 1, status: 'banned' });
    await projectAccessGuard(makeReq(), makeRes(), next);
    expect(forbidden).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user status is suspended', async () => {
    mockFindUnique.mockResolvedValue({ id: 1, status: 'suspended' });
    await projectAccessGuard(makeReq(), makeRes(), next);
    expect(forbidden).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user not found in project DB', async () => {
    mockFindUnique.mockResolvedValue(null);
    await projectAccessGuard(makeReq(), makeRes(), next);
    expect(forbidden).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when req.user is missing', async () => {
    const req = makeReq({ user: undefined });
    await projectAccessGuard(req, makeRes(), next);
    expect(unauthorized).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next(err) when DB lookup throws', async () => {
    const dbError = new Error('DB connection failed');
    mockFindUnique.mockRejectedValue(dbError);
    const mockNext = jest.fn();
    await projectAccessGuard(makeReq(), makeRes(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(dbError);
  });
});
