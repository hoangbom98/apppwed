const { getPrismaClient } = require('../../../config/databases');
const prisma = getPrismaClient('admin');
const { logAdminAction } = require('../utils/adminLogger');

const contentController = {
  async list(req, res) {
    const { projectKey } = req.params;
    const project = await prisma.project.findUnique({ where: { slug: projectKey } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    const items = await prisma.contentItem.findMany({
      where: { projectId: project.id },
      orderBy: { order: 'asc' },
    });
    return res.json(items);
  },

  async create(req, res) {
    const { projectKey } = req.params;
    const { contentType, title, content, imageUrl, link, metadata, audience, startDate, endDate, isActive, order } = req.body;
    
    const project = await prisma.project.findUnique({ where: { slug: projectKey } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const item = await prisma.contentItem.create({
      data: {
        projectId: project.id,
        contentType,
        title,
        content,
        imageUrl,
        link,
        metadata,
        audience: audience || 'all',
        startDate,
        endDate,
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0,
      },
    });
    await logAdminAction(req.user.id, 'create', 'content', item.id, { contentType, title });
    return res.status(201).json(item);
  },

  async update(req, res) {
    const { contentId } = req.params;
    const item = await prisma.contentItem.update({
      where: { id: contentId },
      data: req.body,
    });
    await logAdminAction(req.user.id, 'update', 'content', contentId, { title: item.title });
    return res.json(item);
  },

  async delete(req, res) {
    const { contentId } = req.params;
    const item = await prisma.contentItem.findUnique({ where: { id: contentId } });
    await prisma.contentItem.delete({ where: { id: contentId } });
    await logAdminAction(req.user.id, 'delete', 'content', contentId, { title: item?.title });
    return res.status(204).send();
  },
};

module.exports = contentController;
