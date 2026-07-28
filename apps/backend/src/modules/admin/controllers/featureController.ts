const { getPrismaClient } = require('../../../config/databases');
const prisma = getPrismaClient('admin');
const { logAdminAction } = require('../utils/adminLogger');

const featureController = {
  async list(req, res) {
    const { moduleId } = req.params;
    const features = await prisma.feature.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
    });
    return res.json(features);
  },

  async create(req, res) {
    const { moduleId } = req.params;
    const { key, name, description, valueType, defaultValue, value, order } = req.body;
    const feature = await prisma.feature.create({
      data: {
        moduleId,
        key,
        name,
        description,
        valueType: valueType || 'boolean',
        defaultValue,
        value,
        order: order || 0,
      },
    });
    await logAdminAction(req.user.id, 'create', 'feature', feature.id, { key });
    return res.status(201).json(feature);
  },

  async update(req, res) {
    const { featureId } = req.params;
    const feature = await prisma.feature.update({
      where: { id: featureId },
      data: req.body,
    });
    await logAdminAction(req.user.id, 'update', 'feature', featureId, { key: feature.key });
    return res.json(feature);
  },

  async toggle(req, res) {
    const { featureId } = req.params;
    const feature = await prisma.feature.findUnique({ where: { id: featureId } });
    if (!feature) return res.status(404).json({ error: 'Feature not found' });
    
    if (feature.valueType === 'boolean') {
      const current = feature.value ?? feature.defaultValue ?? false;
      const updated = await prisma.feature.update({
        where: { id: featureId },
        data: { value: !current },
      });
      await logAdminAction(req.user.id, 'toggle', 'feature', featureId, { key: feature.key, newValue: !current });
      return res.json(updated);
    }
    return res.status(400).json({ error: 'Feature not boolean' });
  },

  async delete(req, res) {
    const { featureId } = req.params;
    const feature = await prisma.feature.findUnique({ where: { id: featureId } });
    await prisma.feature.delete({ where: { id: featureId } });
    await logAdminAction(req.user.id, 'delete', 'feature', featureId, { key: feature?.key });
    return res.status(204).send();
  },
};

module.exports = featureController;
