import type { Request, Response } from 'express';
import { getPrismaClient } from '../../../../config/databases';
const { ok, created, noContent, error, notFound } = require('../../../../shared/utils/network/response');
const { logAdminAction } = require('../../utils/adminLogger');

const prisma = getPrismaClient('admin');

export const contentController = {
  async list(req: Request, res: Response): Promise<void> {
    const { projectKey } = req.params;
    const project = await prisma.project.findUnique({ where: { slug: projectKey } });
    if (!project) { notFound(res); return; }

    const items = await prisma.contentItem.findMany({
      where:   { projectId: project.id },
      orderBy: { order: 'asc' },
    });
    ok(res, items);
  },

  async create(req: Request, res: Response): Promise<void> {
    const { projectKey } = req.params;
    const { contentType, title, content, imageUrl, link, metadata, audience, startDate, endDate, isActive, order } = req.body;

    const project = await prisma.project.findUnique({ where: { slug: projectKey } });
    if (!project) { notFound(res); return; }

    const item = await prisma.contentItem.create({
      data: {
        projectId: project.id,
        contentType, title, content, imageUrl, link, metadata,
        audience:  audience  !== undefined ? audience  : 'all',
        startDate, endDate,
        isActive:  isActive  !== undefined ? isActive  : true,
        order:     order     !== undefined ? order     : 0,
      },
    });
    await logAdminAction((req as any).user.id, 'create', 'content', item.id, { contentType, title });
    created(res, item);
  },

  async update(req: Request, res: Response): Promise<void> {
    const { contentId } = req.params;
    const item = await prisma.contentItem.update({
      where: { id: contentId },
      data:  req.body,
    });
    await logAdminAction((req as any).user.id, 'update', 'content', contentId, { title: item.title });
    ok(res, item);
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { contentId } = req.params;
    const item = await prisma.contentItem.findUnique({ where: { id: contentId } });
    await prisma.contentItem.delete({ where: { id: contentId } });
    await logAdminAction((req as any).user.id, 'delete', 'content', contentId, { title: item?.title });
    noContent(res);
  },
};
