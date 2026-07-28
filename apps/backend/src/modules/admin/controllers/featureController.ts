import type { Request, Response } from 'express';
import { getPrismaClient } from '../../../config/databases';
const { ok, created, noContent, error, notFound } = require('../../../shared/utils/network/response');
const { logAdminAction } = require('../utils/adminLogger');

const prisma = getPrismaClient('admin');

export const featureController = {
  async list(req: Request, res: Response): Promise<void> {
    const { moduleId } = req.params;
    const features = await prisma.feature.findMany({
      where:   { moduleId },
      orderBy: { order: 'asc' },
    });
    ok(res, features);
  },

  async create(req: Request, res: Response): Promise<void> {
    const { moduleId } = req.params;
    const { key, name, description, valueType, defaultValue, value, order } = req.body;
    const feature = await prisma.feature.create({
      data: {
        moduleId, key, name, description,
        valueType:    valueType    || 'boolean',
        defaultValue, value,
        order:        order        || 0,
      },
    });
    await logAdminAction((req as any).user.id, 'create', 'feature', feature.id, { key });
    created(res, feature);
  },

  async update(req: Request, res: Response): Promise<void> {
    const { featureId } = req.params;
    const feature = await prisma.feature.update({
      where: { id: featureId },
      data:  req.body,
    });
    await logAdminAction((req as any).user.id, 'update', 'feature', featureId, { key: feature.key });
    ok(res, feature);
  },

  async toggle(req: Request, res: Response): Promise<void> {
    const { featureId } = req.params;
    const feature = await prisma.feature.findUnique({ where: { id: featureId } });
    if (!feature) { notFound(res); return; }

    if (feature.valueType === 'boolean') {
      const current = feature.value ?? feature.defaultValue ?? false;
      const updated = await prisma.feature.update({
        where: { id: featureId },
        data:  { value: !current },
      });
      await logAdminAction((req as any).user.id, 'toggle', 'feature', featureId, { key: feature.key, newValue: !current });
      ok(res, updated);
      return;
    }
    error(res, 'Feature is not boolean', 400);
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { featureId } = req.params;
    const feature = await prisma.feature.findUnique({ where: { id: featureId } });
    await prisma.feature.delete({ where: { id: featureId } });
    await logAdminAction((req as any).user.id, 'delete', 'feature', featureId, { key: feature?.key });
    noContent(res);
  },
};
