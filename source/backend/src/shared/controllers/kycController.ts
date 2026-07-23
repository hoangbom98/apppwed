const service = require('../services/kycService');

const getAll = async (req, res) => {
  try {
    const data = await service.getAll(req.prisma);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await service.getById(req.prisma, req.params.id);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { getAll, getById };
