// SEO metadata for pages/games/tools
const { success, created, notFound, error } = require('../../../shared/utils/response');

exports.getMeta = async (req, res) => {
  try {
    const { type, id } = req.query; // type: game|page|tool, id: slug or id
    if (!type || !id) return error(res, 'type and id required');

    let record = null;
    if (type === 'game') {
      record = await req.prisma.game?.findFirst({ where: { OR: [{ slug: id }, { id: isNaN(+id) ? undefined : +id }] }, select: { name: true, description: true, thumbnail: true } });
    } else if (type === 'page') {
      record = await req.prisma.page?.findFirst({ where: { slug: id }, select: { title: true, content: true, metaTitle: true, metaDescription: true, metaImage: true } });
    } else if (type === 'tool') {
      record = await req.prisma.tool?.findFirst({ where: { slug: id }, select: { name: true, description: true, thumbnail: true } });
    }

    if (!record) return notFound(res, 'Record not found');

    // Return standard OG/meta structure
    return success(res, {
      title: record.metaTitle || record.name || record.title || '',
      description: record.metaDescription || record.description || record.content?.slice(0, 160) || '',
      image: record.metaImage || record.thumbnail || '',
      type,
      id,
    });
  } catch (e) { return error(res, e.message); }
};

// ── Admin SEO CRUD ────────────────────────────────────────────────
// Updates SEO fields directly on the page/game/tool record.
// body: { type, targetId, metaTitle, metaDescription, metaImage }

exports.create = async (req, res) => {
  try {
    const { type, targetId, ...seoFields } = req.body;
    if (!type || !targetId) return error(res, 'type and targetId required');
    const model = type === 'game' ? req.prisma.game
                : type === 'page' ? req.prisma.page
                : type === 'tool' ? req.prisma.tool
                : null;
    if (!model) return error(res, 'Invalid type', 400);
    const item = await model.update({ where: { id: targetId }, data: seoFields });
    return created(res, item);
  } catch (e) {
    if (e.code === 'P2025') return notFound(res);
    return error(res, e.message, 500);
  }
};

exports.update = async (req, res) => {
  try {
    const { type, ...seoFields } = req.body;
    const model = type === 'game' ? req.prisma.game
                : type === 'page' ? req.prisma.page
                : type === 'tool' ? req.prisma.tool
                : null;
    if (!model) return error(res, 'Invalid type', 400);
    const item = await model.update({ where: { id: req.params.id }, data: seoFields });
    return success(res, item, 'SEO updated');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res);
    return error(res, e.message, 500);
  }
};

exports.remove = async (req, res) => {
  try {
    const { type } = req.query;
    const model = type === 'game' ? req.prisma.game
                : type === 'page' ? req.prisma.page
                : type === 'tool' ? req.prisma.tool
                : null;
    if (!model) return error(res, 'Invalid type query param', 400);
    // Clear SEO fields rather than deleting the record
    await model.update({ where: { id: req.params.id }, data: { metaTitle: null, metaDescription: null, metaImage: null } });
    return success(res, { id: req.params.id }, 'SEO cleared');
  } catch (e) {
    if (e.code === 'P2025') return notFound(res);
    return error(res, e.message, 500);
  }
};
