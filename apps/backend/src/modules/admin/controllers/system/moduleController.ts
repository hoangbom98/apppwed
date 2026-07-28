const { getPrismaClient } = require('../../../config/databases');
const prisma = getPrismaClient('admin');
const { logAdminAction } = require('../utils/adminLogger');

const moduleController = {
  async list(req, res) {
    const { projectKey } = req.params;
    const project = await prisma.project.findUnique({ where: { slug: projectKey } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    const modules = await prisma.module.findMany({
      where: { projectId: project.id },
      include: { features: true },
      orderBy: { order: 'asc' },
    });
    return res.json(modules);
  },

  async create(req, res) {
    const { projectKey } = req.params;
    const { key, name, description, isEnabled, permissions, configSchema, settings, order } = req.body;
    const project = await prisma.project.findUnique({ where: { slug: projectKey } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    const module = await prisma.module.create({
      data: {
        projectId: project.id,
        key,
        name,
        description,
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        permissions: permissions || {},
        configSchema,
        settings,
        order: order || 0,
      },
    });
    await logAdminAction(req.user.id, 'create', 'module', module.id, { key });
    return res.status(201).json(module);
  },

  async update(req, res) {
    const { moduleId } = req.params;
    const module = await prisma.module.update({
      where: { id: moduleId },
      data: req.body,
    });
    await logAdminAction(req.user.id, 'update', 'module', moduleId, { key: module.key });
    return res.json(module);
  },

  async toggle(req, res) {
    const { moduleId } = req.params;
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) return res.status(404).json({ error: 'Module not found' });
    const updated = await prisma.module.update({
      where: { id: moduleId },
      data: { isEnabled: !module.isEnabled },
    });
    await logAdminAction(req.user.id, 'toggle', 'module', moduleId, { key: module.key, isEnabled: updated.isEnabled });
    return res.json(updated);
  },

  async delete(req, res) {
    const { moduleId } = req.params;
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    await prisma.module.delete({ where: { id: moduleId } });
    await logAdminAction(req.user.id, 'delete', 'module', moduleId, { key: module?.key });
    return res.status(204).send();
  },
};

module.exports = moduleController;
