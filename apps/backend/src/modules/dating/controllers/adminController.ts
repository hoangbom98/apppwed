import type { Request, Response } from 'express';
const { ok, created, notFound, error } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');
const { logAdminAction } = require('../../../shared/services/auditLogger.service');

// ── Profiles ──────────────────────────────────────────────────────

export const listProfiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.search) where.OR = [
      { username: { contains: req.query.search } },
      { email:    { contains: req.query.search } },
    ];
    const [data, total] = await Promise.all([
      (req as any).prisma.user.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, email: true, gender: true, status: true, vipLevel: true, createdAt: true },
      }),
      (req as any).prisma.user.count({ where }),
    ]);
    ok(res, data, undefined, { total, page, limit, pages: Math.ceil(total / take) } as any);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await (req as any).prisma.user.findUnique({ where: { id: req.params.id } });
    if (!item) { notFound(res); return; }
    ok(res, item);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const oldUser = await (req as any).prisma.user.findUnique({ where: { id } });
    if (!oldUser) { notFound(res); return; }

    const updatedUser = await (req as any).prisma.user.update({ where: { id }, data: req.body });
    await logAdminAction((req as any).user.id, 'updateProfile', id, oldUser, updatedUser, (req as any).ip, (req as any).prisma);

    ok(res, updatedUser, 'Profile updated');
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const deleteProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    await (req as any).prisma.user.update({ where: { id: req.params.id }, data: { status: 'banned' } });
    ok(res, { id: req.params.id }, 'Profile banned');
  } catch (e: any) {
    if (e.code === 'P2025') { notFound(res); return; }
    error(res, e.message, 500);
  }
};

// ── Matches ───────────────────────────────────────────────────────

export const listMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      (req as any).prisma.match.findMany({
        skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          user1: { select: { username: true } },
          user2: { select: { username: true } },
        },
      }),
      (req as any).prisma.match.count(),
    ]);
    ok(res, data, undefined, { total, page, limit, pages: Math.ceil(total / take) } as any);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const getMatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await (req as any).prisma.match.findUnique({
      where: { id: req.params.id },
      include: { user1: { select: { username: true } }, user2: { select: { username: true } } },
    });
    if (!item) { notFound(res); return; }
    ok(res, item);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const deleteMatch = async (req: Request, res: Response): Promise<void> => {
  try {
    await (req as any).prisma.match.delete({ where: { id: req.params.id } });
    ok(res, { id: req.params.id }, 'Match deleted');
  } catch (e: any) {
    if (e.code === 'P2025') { notFound(res); return; }
    error(res, e.message, 500);
  }
};

// ── Gifts ─────────────────────────────────────────────────────────

export const listGifts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      (req as any).prisma.gift.findMany({ skip, take, orderBy: { sortOrder: 'asc' } }),
      (req as any).prisma.gift.count(),
    ]);
    ok(res, data, undefined, { total, page, limit, pages: Math.ceil(total / take) } as any);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const getGift = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await (req as any).prisma.gift.findUnique({ where: { id: req.params.id } });
    if (!item) { notFound(res); return; }
    ok(res, item);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const createGift = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await (req as any).prisma.gift.create({ data: req.body });
    created(res, item);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const updateGift = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await (req as any).prisma.gift.update({ where: { id: req.params.id }, data: req.body });
    ok(res, item, 'Gift updated');
  } catch (e: any) {
    if (e.code === 'P2025') { notFound(res); return; }
    error(res, e.message, 500);
  }
};

export const deleteGift = async (req: Request, res: Response): Promise<void> => {
  try {
    await (req as any).prisma.gift.delete({ where: { id: req.params.id } });
    ok(res, { id: req.params.id }, 'Gift deleted');
  } catch (e: any) {
    if (e.code === 'P2025') { notFound(res); return; }
    error(res, e.message, 500);
  }
};

// ── Moments (feed posts) ──────────────────────────────────────────

export const listMoments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      (req as any).prisma.feedPost.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { username: true } } },
      }),
      (req as any).prisma.feedPost.count({ where }),
    ]);
    ok(res, data, undefined, { total, page, limit, pages: Math.ceil(total / take) } as any);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const getMoment = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await (req as any).prisma.feedPost.findUnique({
      where: { id: req.params.id },
      include: { author: { select: { username: true } } },
    });
    if (!item) { notFound(res); return; }
    ok(res, item);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const updateMoment = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await (req as any).prisma.feedPost.update({ where: { id: req.params.id }, data: req.body });
    ok(res, item, 'Moment updated');
  } catch (e: any) {
    if (e.code === 'P2025') { notFound(res); return; }
    error(res, e.message, 500);
  }
};

export const deleteMoment = async (req: Request, res: Response): Promise<void> => {
  try {
    await (req as any).prisma.feedPost.delete({ where: { id: req.params.id } });
    ok(res, { id: req.params.id }, 'Moment deleted');
  } catch (e: any) {
    if (e.code === 'P2025') { notFound(res); return; }
    error(res, e.message, 500);
  }
};

// ── Reports / Violations ──────────────────────────────────────────

export const listReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      (req as any).prisma.userReport.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { username: true } },
          reported: { select: { username: true } },
        },
      }),
      (req as any).prisma.userReport.count({ where }),
    ]);
    ok(res, data, undefined, { total, page, limit, pages: Math.ceil(total / take) } as any);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const getReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await (req as any).prisma.userReport.findUnique({ where: { id: req.params.id } });
    if (!item) { notFound(res); return; }
    ok(res, item);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const updateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await (req as any).prisma.userReport.update({ where: { id: req.params.id }, data: req.body });
    ok(res, item, 'Report updated');
  } catch (e: any) {
    if (e.code === 'P2025') { notFound(res); return; }
    error(res, e.message, 500);
  }
};

// ── Live Sessions ─────────────────────────────────────────────────

export const listLive = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = req.query.status;
    const [data, total] = await Promise.all([
      (req as any).prisma.liveStream.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: { host: { select: { username: true } } },
      }),
      (req as any).prisma.liveStream.count({ where }),
    ]);
    ok(res, data, undefined, { total, page, limit, pages: Math.ceil(total / take) } as any);
  } catch (e: unknown) { error(res, e instanceof Error ? e.message : 'Error', 500); }
};

export const deleteLive = async (req: Request, res: Response): Promise<void> => {
  try {
    await (req as any).prisma.liveStream.update({ where: { id: req.params.id }, data: { status: 'ended' } });
    ok(res, { id: req.params.id }, 'Live session ended');
  } catch (e: any) {
    if (e.code === 'P2025') { notFound(res); return; }
    error(res, e.message, 500);
  }
};
