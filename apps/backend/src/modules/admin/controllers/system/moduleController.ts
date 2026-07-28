import type { Request, Response } from 'express';
import { getPrismaClient } from '../../../../config/databases';
const { ok, created, noContent, error, notFound } = require('../../../../shared/utils/network/response');
const { logAdminAction } = require('../../utils/adminLogger');

const prisma = getPrismaClient('admin');

export const moduleController = {
  async list(req: Request, res: Response): Promise<void> {
    const { projectKey } = req.params;
    const project = await prisma.project.findUnique({ where: { slug: projectKey } });
    if (!project) { notFound(res); return; }

    const modules = await prisma.module.findMany({
      where:   { projectId: project.id },
      include: { features: true },
      orderBy: { order: 'asc' },
    });
    ok(res, modules);
  },

  async create(req: Request, res: Response): Promise<void> {
    const { projectKey } = req.params;
    const { key, name, description, isEnabled, permissions, configSchema, settings, order } = req.body;
    const project = await prisma.project.findUnique({ where: { slug: projectKey } });
    if (!project) { notFound(res); return; }

    const module = await prisma.module.create({
      data: {
        projectId: project.id,
        key, name, description,
        isEnabled:  isEnabled  !== undefined ? isEnabled  : true,
        permissions: permissions || {},
        configSchema, settings,
        order:      order      !== undefined ? order      : 0,
      },
    });
    await logAdminAction((req as any).user.id, 'create', 'module', module.id, { key });
    created(res, module);
  },

  async update(req: Request, res: Response): Promise<void> {
    const { moduleId } = req.params;
    const module = await prisma.module.update({
      where: { id: moduleId },
      data:  req.body,
    });
    await logAdminAction((req as any).user.id, 'update', 'module', moduleId, { key: module.key });
    ok(res, module);
  },

  async toggle(req: Request, res: Response): Promise<void> {
    const { moduleId } = req.params;
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) { notFound(res); return; }

    const updated = await prisma.module.update({
      where: { id: moduleId },
      data:  { isEnabled: !module.isEnabled },
    });
    await logAdminAction((req as any).user.id, 'toggle', 'module', moduleId, { key: module.key, isEnabled: updated.isEnabled });
    ok(res, updated);
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { moduleId } = req.params;
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    await prisma.module.delete({ where: { id: moduleId } });
    await logAdminAction((req as any).user.id, 'delete', 'module', moduleId, { key: module?.key });
    noContent(res);
  },
};
