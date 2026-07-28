/**
 * Unit tests for projectResolver middleware.
 *
 * Covers the three resolution strategies:
 *   1. URL path prefix  (/api/game/* → 'game')
 *   2. Hostname subdomain  (game.lkvip.com → 'game')
 *   3. X-Project header override
 */

// ── Mocks ──────────────────────────────────────────────────────────────────────
// Mock constants before requiring the middleware
jest.mock('@lkvip/constants', () => ({
  ROUTE_PROJECT_MAP: {
    '/api/hub':    'hub',
    '/api/game':   'game',
    '/api/trade':  'trade',
    '/api/dating': 'dating',
    '/api/sports': 'sports',
    '/api/admin':  'admin',
  },
  PROJECT_IDS: ['hub', 'game', 'trade', 'dating', 'sports', 'admin'],
}));

jest.mock('../../../config/databases', () => ({
  getPrismaClient: jest.fn().mockReturnValue({}),
}));

// Import SUT after mocks
// eslint-disable-next-line @typescript-eslint/no-var-requires
const projectResolver = require('../projectResolver');

const { getPrismaClient } = require('../../../config/databases') as {
  getPrismaClient: jest.Mock;
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeReq(path = '/', host = 'localhost', xProject?: string): any {
  return {
    path,
    get: (header: string) => {
      if (header.toLowerCase() === 'host') return host;
      if (header.toLowerCase() === 'x-project') return xProject ?? null;
      return null;
    },
  };
}

function makeRes(): any {
  return {};
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('projectResolver', () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    getPrismaClient.mockReturnValue({ _project: 'mock' });
  });

  // ── 1. URL path prefix ──────────────────────────────────────────────────────

  it('resolves "game" from /api/game path prefix', () => {
    const req = makeReq('/api/game/config');
    projectResolver(req, makeRes(), next);
    expect(req.project).toBe('game');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('resolves "trade" from /api/trade path prefix', () => {
    const req = makeReq('/api/trade/orders');
    projectResolver(req, makeRes(), next);
    expect(req.project).toBe('trade');
  });

  it('resolves "admin" from /api/admin path prefix', () => {
    const req = makeReq('/api/admin/dashboard');
    projectResolver(req, makeRes(), next);
    expect(req.project).toBe('admin');
  });

  // ── 2. Hostname subdomain ───────────────────────────────────────────────────

  it('resolves project from hostname subdomain (game.lkvip.com → game)', () => {
    const req = makeReq('/', 'game.lkvip.com');
    projectResolver(req, makeRes(), next);
    expect(req.project).toBe('game');
    expect(next).toHaveBeenCalled();
  });

  it('resolves project from hostname subdomain (dating.lkvip.com → dating)', () => {
    const req = makeReq('/', 'dating.lkvip.com');
    projectResolver(req, makeRes(), next);
    expect(req.project).toBe('dating');
  });

  it('falls back to "hub" for unknown subdomain', () => {
    const req = makeReq('/', 'unknown.lkvip.com');
    projectResolver(req, makeRes(), next);
    expect(req.project).toBe('hub');
  });

  // ── 3. X-Project header ─────────────────────────────────────────────────────

  it('honours X-Project header when valid', () => {
    const req = makeReq('/', 'localhost', 'sports');
    projectResolver(req, makeRes(), next);
    expect(req.project).toBe('sports');
  });

  it('ignores X-Project header when invalid project value', () => {
    // Path resolves to game; invalid header should not override
    const req = makeReq('/api/game/rounds', 'localhost', 'invalid-project');
    projectResolver(req, makeRes(), next);
    // path prefix wins; invalid header is ignored
    expect(req.project).toBe('game');
  });

  // ── 4. Prisma client attachment ─────────────────────────────────────────────

  it('attaches req.prisma from getPrismaClient(project)', () => {
    const mockPrisma = { _name: 'game-prisma' };
    getPrismaClient.mockReturnValueOnce(mockPrisma);
    const req = makeReq('/api/game/stats');
    projectResolver(req, makeRes(), next);
    expect(getPrismaClient).toHaveBeenCalledWith('game');
    expect(req.prisma).toBe(mockPrisma);
  });

  // ── 5. Default fallback ─────────────────────────────────────────────────────

  it('defaults to "hub" when path and host both unrecognised', () => {
    const req = makeReq('/some/other/path', 'localhost');
    projectResolver(req, makeRes(), next);
    expect(req.project).toBe('hub');
  });

  // ── 6. next() is always called ──────────────────────────────────────────────

  it('always calls next()', () => {
    const req = makeReq('/api/dating/profiles');
    projectResolver(req, makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
