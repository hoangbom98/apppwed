/**
 * featureFlagController — CRUD for FeatureFlag model in admin_db.
 *
 * Public  (no auth): GET /api/shared/features?project=xxx
 * Admin   (auth):    GET|PUT|DELETE /api/admin/features/:key?project=xxx
 */
const { getPrismaClient }  = require('../../../config/databases');
const { logAdminAction }   = require('../utils/adminLogger');

const prisma = getPrismaClient('admin');

const featureFlagController = {
  /**
   * GET /api/shared/features?project=xxx
   * Public — returns all enabled flags for a project.
   */
  async getFlags(req, res) {
    const project = (req.query.project as string) || 'all';
    const flags = await prisma.featureFlag.findMany({
      where: {
        enabled: true,
        project: { in: [project, 'all'] },
      },
      select: { key: true, project: true, enabled: true, config: true },
    });
    res.json({ success: true, data: flags });
  },

  /**
   * GET /api/admin/feature-flags
   * Admin — list all flags, optionally filtered by project.
   */
  async listFlags(req, res) {
    const project = req.query.project as string | undefined;
    const flags = await prisma.featureFlag.findMany({
      where: project ? { project } : undefined,
      orderBy: [{ project: 'asc' }, { key: 'asc' }],
    });
    res.json({ success: true, data: flags });
  },

  /**
   * PUT /api/admin/feature-flags/:key
   * Admin — create or update a flag. Body: { project, enabled, description?, config? }
   */
  async upsertFlag(req, res) {
    const { key } = req.params;
    const { project = 'all', enabled = false, description, config } = req.body;

    const flag = await prisma.featureFlag.upsert({
      where:  { key_project: { key, project } },
      create: { key, project, enabled, description, config },
      update: { enabled, description, config },
    });

    await logAdminAction(
      req.user.id, 'upsert_feature_flag', 'feature_flag', `${project}:${key}`,
      { enabled, config },
    );

    res.json({ success: true, data: flag });
  },

  /**
   * PATCH /api/admin/feature-flags/:key/toggle
   * Admin — toggle enabled on/off for a specific project.
   */
  async toggleFlag(req, res) {
    const { key } = req.params;
    const { project = 'all' } = req.body;

    const existing = await prisma.featureFlag.findUnique({
      where: { key_project: { key, project } },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Flag not found' });
    }

    const flag = await prisma.featureFlag.update({
      where: { key_project: { key, project } },
      data:  { enabled: !existing.enabled },
    });

    await logAdminAction(
      req.user.id, 'toggle_feature_flag', 'feature_flag', `${project}:${key}`,
      { enabled: flag.enabled },
    );

    res.json({ success: true, data: flag });
  },

  /**
   * DELETE /api/admin/feature-flags/:key
   * Admin — remove a flag by key+project.
   */
  async deleteFlag(req, res) {
    const { key } = req.params;
    const { project = 'all' } = req.body;

    await prisma.featureFlag.delete({
      where: { key_project: { key, project } },
    }).catch(() => null); // ignore not-found

    await logAdminAction(
      req.user.id, 'delete_feature_flag', 'feature_flag', `${project}:${key}`, {},
    );

    res.status(204).send();
  },
};

module.exports = featureFlagController;
