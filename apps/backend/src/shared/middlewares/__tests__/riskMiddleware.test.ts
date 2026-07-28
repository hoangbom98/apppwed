/**
 * Unit tests for riskMiddleware guard factories.
 *
 * Each guard (ddosGuard, ipBlockGuard, injectionGuard, botGuard, geoGuard)
 * is tested in isolation using stub services and mocked Redis.
 */

// ── Mocks ──────────────────────────────────────────────────────────────────────

// riskService and redis are provided by moduleNameMapper in jest.config.ts
// pointing to src/__tests__/__mocks__/riskService.ts and redis.ts respectively.
// We do NOT call jest.mock() for them — the mapper handles it transparently.

jest.mock('../../services/logger', () => ({
  info:     jest.fn(),
  warn:     jest.fn(),
  error:    jest.fn(),
  security: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const riskMiddleware = require('../riskMiddleware');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const riskService = require('../../services/riskService');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const redis = require('../../../config/redis');

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeReq(overrides: Record<string, any> = {}): any {
  return {
    ip:      '127.0.0.1',
    method:  'GET',
    path:    '/api/game/config',
    headers: {},
    body:    {},
    query:   {},
    get: (header: string) => overrides.headers?.[header.toLowerCase()] ?? null,
    ...overrides,
  };
}

function makeRes(): any {
  return {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn(),
    setHeader: jest.fn(),
  };
}

// ── ddosGuard ─────────────────────────────────────────────────────────────────

describe('riskMiddleware.ddosGuard()', () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    riskService.checkDdos.mockResolvedValue({ blocked: false });
  });

  it('calls next() when IP is not DDoS-blocked', async () => {
    const mw = riskMiddleware.ddosGuard();
    await mw(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 429 when IP is DDoS-blocked', async () => {
    riskService.checkDdos.mockResolvedValue({ blocked: true, reason: 'flood' });
    const mw = riskMiddleware.ddosGuard();
    const res = makeRes();
    await mw(makeReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when riskService.checkDdos throws (non-fatal)', async () => {
    riskService.checkDdos.mockRejectedValue(new Error('redis down'));
    const mw = riskMiddleware.ddosGuard();
    await mw(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

// ── ipBlockGuard ──────────────────────────────────────────────────────────────

describe('riskMiddleware.ipBlockGuard()', () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    redis.get.mockResolvedValue(null);
  });

  it('calls next() when IP is not in Redis blocked set', async () => {
    const mw = riskMiddleware.ipBlockGuard();
    await mw(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 403 when IP is in Redis blocked set', async () => {
    redis.get.mockResolvedValue('1');
    const mw = riskMiddleware.ipBlockGuard();
    const res = makeRes();
    await mw(makeReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when Redis lookup throws (fail open)', async () => {
    redis.get.mockRejectedValue(new Error('timeout'));
    const mw = riskMiddleware.ipBlockGuard();
    await mw(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

// ── injectionGuard ────────────────────────────────────────────────────────────

describe('riskMiddleware.injectionGuard()', () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    riskService.scanInput.mockReturnValue({ detected: false });
  });

  it('calls next() when body scan returns no injection', async () => {
    const mw = riskMiddleware.injectionGuard();
    await mw(makeReq({ body: { user: 'alice' } }), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when body scan detects injection', async () => {
    riskService.scanInput.mockReturnValue({ detected: true, type: 'sql' });
    riskService.handleAttack.mockResolvedValue(undefined);
    const mw = riskMiddleware.injectionGuard();
    const res = makeRes();
    await mw(makeReq({ body: { q: "1' OR '1'='1'" } }), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when body is empty', async () => {
    const mw = riskMiddleware.injectionGuard();
    await mw(makeReq({ body: {} }), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

// ── botGuard ──────────────────────────────────────────────────────────────────

describe('riskMiddleware.botGuard()', () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    riskService.detectBot.mockReturnValue({ isBot: false, confidence: 0 });
  });

  it('calls next() for normal browser request', async () => {
    const mw = riskMiddleware.botGuard();
    await mw(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('calls next() for request without user-agent (API clients)', async () => {
    const mw = riskMiddleware.botGuard();
    await mw(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

// ── geoGuard ──────────────────────────────────────────────────────────────────

describe('riskMiddleware.geoGuard()', () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    riskService.checkLocation.mockResolvedValue({ risk: 'low' });
  });

  it('calls next() when location risk is not critical', async () => {
    const mw = riskMiddleware.geoGuard();
    await mw(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 403 for critical geo risk', async () => {
    riskService.checkLocation.mockResolvedValue({ risk: 'critical', reason: 'sanctioned country' });
    const mw = riskMiddleware.geoGuard();
    const res = makeRes();
    await mw(makeReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when geo check throws (fail open)', async () => {
    riskService.checkLocation.mockRejectedValue(new Error('maxmind offline'));
    const mw = riskMiddleware.geoGuard();
    await mw(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
