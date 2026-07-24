/**
 * game/controllers/spinController.js
 *
 * Lucky Wheel / Spin-to-win.
 * Routes:
 *   GET  /wheel             — public: wheel config + prizes
 *   GET  /wheel/my-spins    — protected: user's free spin status today
 *   POST /wheel/spin        — protected: execute a spin
 *   GET  /wheel/history     — protected: user's spin history (paginated)
 */
const { success, error, badRequest } = require('../../../shared/utils/response');
const { paginate }                   = require('../../../shared/utils/helpers');
const spinSvc                        = require('../services/spinService');

// ── GET /game/wheel — public ──────────────────────────────────────────────────
exports.getWheel = async (req, res) => {
  try {
    const wheel = await spinSvc.getWheelConfig(req.prisma);
    if (!wheel) return success(res, null, 'Vòng quay chưa được kích hoạt');
    // Strip sensitive probability data from public response
    const publicWheel = {
      id:                wheel.id,
      name:              wheel.name,
      spinCost:          wheel.spinCost,
      maxFreeSpinsPerDay: wheel.maxFreeSpinsPerDay,
      prizes:            wheel.prizes.map(p => ({
        id:         p.id,
        label:      p.label,
        rewardType: p.rewardType,
        color:      p.color,
        icon:       p.icon,
        sortOrder:  p.sortOrder,
      })),
    };
    return success(res, publicWheel);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /game/wheel/my-spins — protected ──────────────────────────────────────
exports.getMySpins = async (req, res) => {
  try {
    const status = await spinSvc.getUserSpinStatus(req.user.id, req.prisma);
    return success(res, status);
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /game/wheel/spin — protected ─────────────────────────────────────────
exports.spin = async (req, res) => {
  try {
    const isFree = req.body.isFree !== false; // default true
    const result = await spinSvc.spin(req.user.id, isFree, req.prisma);
    return success(res, result, 'Chúc mừng! Bạn đã quay thành công');
  } catch (e) {
    const isUserError = e.message && !e.message.includes('prisma');
    if (isUserError) return badRequest(res, e.message);
    return error(res, e.message, 500);
  }
};

// ── GET /game/wheel/history — protected ───────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const [data, total] = await Promise.all([
      req.prisma.spinHistory.findMany({
        where:   { userId: req.user.id },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { prize: { select: { label: true, color: true, icon: true } } },
      }),
      req.prisma.spinHistory.count({ where: { userId: req.user.id } }),
    ]);
    return res.json({ success: true, data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  } catch (e) { return error(res, e.message, 500); }
};
