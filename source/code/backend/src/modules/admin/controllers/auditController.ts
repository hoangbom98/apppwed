// @ts-nocheck
// backend/src/modules/admin/controllers/auditController.js
const { getPrismaClient } = require('../../../shared/config/databases');

exports.getLogs = async (req, res) => {
  try {
    const prisma = getPrismaClient('admin');
    const { page = 1, limit = 20, module, action } = req.query;
    const where = {};
    if (module) where.module = module;
    if (action) where.action = action;
    
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where, 
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * parseInt(limit), 
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where })
    ]);
    res.json({ data: logs, total, page, limit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
