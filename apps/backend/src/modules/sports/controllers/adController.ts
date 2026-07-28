import type { Request, Response } from 'express';
const { success, error } = require('../../../shared/utils/network/response');

export const getByPosition = async (req: Request, res: Response): Promise<void> => {
  try {
    const { position } = req.query;
    if (!position) { error(res, 'Position is required'); return; }

    const now = new Date();
    const where = {
      position,
      status: 'active',
      OR: [
        { AND: [{ startDate: { lte: now } }, { endDate: { gte: now } }] },
        { AND: [{ startDate: null }, { endDate: null }] },
      ],
    };

    const ads = await (req as any).prisma.adBanner.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      take:    10,
    });

    success(res, { ads });
  } catch (e: unknown) {
    error(res, e instanceof Error ? e.message : 'Error', 500);
  }
};
