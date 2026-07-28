import type { Request, Response } from 'express';
import { getPrismaClient } from '../../../../config/databases';
const { ok, created, noContent, notFound } = require('../../../../shared/utils/network/response');
const { logAdminAction } = require('../../utils/adminLogger');

const prisma = getPrismaClient('admin');

export const projectController = {
  async list(_req: Request, res: Response): Promise<void> {
    const projects = await prisma.project.findMany({
      include: { modules: { include: { features: true } } },
      orderBy: { order: 'asc' },
    });
    ok(res, projects);
  },

  async create(req: Request, res: Response): Promise<void> {
    const { key } = req.body;
    const project = await prisma.project.create({
      data: { key, name: req.body.name, domain: key, slug: key, status: 'ACTIVE' },
    });
    await logAdminAction((req as any).user.id, 'create', 'project', project.id, { key });
    created(res, project);
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const project = await prisma.project.update({
      where: { id },
      data:  req.body,
    });
    await logAdminAction((req as any).user.id, 'update', 'project', id, { slug: project.slug });
    ok(res, project);
  },

  async toggle(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) { notFound(res); return; }

    const updated = await prisma.project.update({
      where: { id },
      data:  { status: project.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
    });
    await logAdminAction((req as any).user.id, 'toggle', 'project', id, { status: updated.status });
    ok(res, updated);
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });
    await prisma.project.delete({ where: { id } });
    await logAdminAction((req as any).user.id, 'delete', 'project', id, { slug: project?.slug });
    noContent(res);
  },
};
