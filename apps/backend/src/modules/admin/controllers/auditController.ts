import type { Request, Response } from 'express';
import { getPrismaClient } from '../../../config/databases';
const { ok, error } = require('../../../shared/utils/network/response');

export const getLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const prisma = getPrismaClient('admin');
    const page   = Number(req.query.page)  || 1;
    const limit  = Number(req.query.limit) || 20;
    const where: Record<string, unknown> = {};
    if (req.query.module) where.module = req.query.module;
    if (req.query.action) where.action = req.query.action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    ok(res, { logs, total, page, limit });
  } catch (err: unknown) {
    error(res, err instanceof Error ? err.message : 'Internal error', 500);
  }
};
