const { getPrismaClient } = require('../../../config/databases');
const prisma = getPrismaClient('admin');
const { logAdminAction } = require('../utils/adminLogger'); // Will create this later

const projectController = {
  async list(req, res) {
    const projects = await prisma.project.findMany({
      include: { modules: { include: { features: true } } },
      orderBy: { order: 'asc' },
    });
    return res.json(projects);
  },

  async create(req, res) {
    const { key, name, description, icon, order, config } = req.body;
    const project = await prisma.project.create({
      data: { key, name, domain: key, slug: key, status: 'ACTIVE' },
    });
    // Log action (will implement logAdminAction)
    return res.status(201).json(project);
  },
  
  async update(req, res) {
    const { id } = req.params;
    const project = await prisma.project.update({
      where: { id },
      data: req.body,
    });
    await logAdminAction(req.user.id, 'update', 'project', id, { slug: project.slug });
    return res.json(project);
  },

  async toggle(req, res) {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const updated = await prisma.project.update({
      where: { id },
      data: { status: project.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
    });
    await logAdminAction(req.user.id, 'toggle', 'project', id, { status: updated.status });
    return res.json(updated);
  },

  async delete(req, res) {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });
    await prisma.project.delete({ where: { id } });
    await logAdminAction(req.user.id, 'delete', 'project', id, { slug: project?.slug });
    return res.status(204).send();
  },
};

module.exports = projectController;
