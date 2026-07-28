import type { Request, Response } from 'express';
const { ok, error } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');
const { logAdminAction } = require('../../../shared/services/auditLogger.service');

// ── Leagues ───────────────────────────────────────────────────────

export const listLeagues = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      (req as any).prisma.league.findMany({ skip, take, orderBy: { sortOrder: 'asc' } }),
      (req as any).prisma.league.count(),
    ]);
    ok(res, data, undefined, { total, page, limit, pages: Math.ceil(total / take) } as any);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const createLeague = async (req: Request, res: Response): Promise<void> => {
  try {
    const d = await (req as any).prisma.league.create({ data: req.body });
    ok(res, d, 'League created');
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const updateLeague = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const oldData = await (req as any).prisma.league.findUnique({ where: { id } });
    if (!oldData) { error(res, 'League not found', 404); return; }

    const d = await (req as any).prisma.league.update({ where: { id }, data: req.body });
    await logAdminAction((req as any).user.id, 'updateLeague', id, oldData, d, (req as any).ip, (req as any).prisma);
    ok(res, d, 'League updated');
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const deleteLeague = async (req: Request, res: Response): Promise<void> => {
  try {
    await (req as any).prisma.league.delete({ where: { id: req.params.id } });
    ok(res, { id: req.params.id });
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

// ── Teams ─────────────────────────────────────────────────────────

export const listTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      (req as any).prisma.team.findMany({ skip, take, include: { league: { select: { name: true } } } }),
      (req as any).prisma.team.count(),
    ]);
    ok(res, data, undefined, { total, page, limit, pages: Math.ceil(total / take) } as any);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const createTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const d = await (req as any).prisma.team.create({ data: req.body });
    ok(res, d, 'Team created');
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const updateTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const d = await (req as any).prisma.team.update({ where: { id: req.params.id }, data: req.body });
    ok(res, d);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const deleteTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    await (req as any).prisma.team.delete({ where: { id: req.params.id } });
    ok(res, { id: req.params.id });
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

// ── Matches ───────────────────────────────────────────────────────

export const listMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      (req as any).prisma.match.findMany({
        where, skip, take,
        orderBy: { startTime: 'desc' },
        include: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
          league:   { select: { name: true } },
        },
      }),
      (req as any).prisma.match.count({ where }),
    ]);
    ok(res, data, undefined, { total, page, limit, pages: Math.ceil(total / take) } as any);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const createMatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const d = await (req as any).prisma.match.create({ data: req.body });
    ok(res, d, 'Match created');
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const updateMatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const d = await (req as any).prisma.match.update({ where: { id: req.params.id }, data: req.body });
    ok(res, d);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

// ── Articles ──────────────────────────────────────────────────────

export const listArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      (req as any).prisma.news.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      (req as any).prisma.news.count(),
    ]);
    ok(res, data, undefined, { total, page, limit, pages: Math.ceil(total / take) } as any);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const createArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const d = await (req as any).prisma.news.create({ data: req.body });
    ok(res, d, 'Article created');
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const updateArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const d = await (req as any).prisma.news.update({ where: { id: req.params.id }, data: req.body });
    ok(res, d);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const deleteArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    await (req as any).prisma.news.delete({ where: { id: req.params.id } });
    ok(res, { id: req.params.id });
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

// ── Bets ──────────────────────────────────────────────────────────

export const listBets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      (req as any).prisma.betSlip.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { user: { select: { username: true } } } }),
      (req as any).prisma.betSlip.count({ where }),
    ]);
    ok(res, data, undefined, { total, page, limit, pages: Math.ceil(total / take) } as any);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const updateBet = async (req: Request, res: Response): Promise<void> => {
  try {
    const d = await (req as any).prisma.betSlip.update({ where: { id: req.params.id }, data: req.body });
    ok(res, d);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

// ── Users ─────────────────────────────────────────────────────────

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.search) where.OR = [
      { username: { contains: req.query.search } },
      { email:    { contains: req.query.search } },
    ];
    const [data, total] = await Promise.all([
      (req as any).prisma.user.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, select: { id: true, username: true, email: true, role: true, status: true, createdAt: true } }),
      (req as any).prisma.user.count({ where }),
    ]);
    ok(res, data, undefined, { total, page, limit, pages: Math.ceil(total / take) } as any);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};
