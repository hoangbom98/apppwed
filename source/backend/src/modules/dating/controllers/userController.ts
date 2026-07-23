// @ts-nocheck
'use strict';
/**
 * dating/controllers/userController.js
 * Public user profile discovery & social actions in dating_db.
 * Routes: GET /users/home, GET /users/discovery, GET /users/:id,
 *         POST /users/:id/report, POST /users/:id/block
 */
const { success, error, notFound } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');
const UserService  = require('../services/userService');

// ── GET /dating/users/home — personalised home data ──────────────────────────
exports.getHomeData = async (req, res) => {
  try {
    const userId = req.user.id;

    const [me, recentLikes, unreadMatches] = await Promise.all([
      req.prisma.user.findUnique({
        where:  { id: userId },
        select: { id: true, fullName: true, avatar: true, coins: true, isVip: true, isVerified: true },
      }),
      req.prisma.like.count({
        where: { receiverId: userId, createdAt: { gt: new Date(Date.now() - 24 * 3600 * 1000) } },
      }),
      req.prisma.match.count({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: 'matched',
          updatedAt: { gt: new Date(Date.now() - 24 * 3600 * 1000) },
        },
      }),
    ]);

    return success(res, { me, recentLikes, unreadMatches });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /dating/users/discovery — swipeable profiles ─────────────────────────
exports.getDiscovery = async (req, res) => {
  try {
    const userId = req.user.id;
    const { skip, take } = paginate(req.query.page, req.query.limit || 20);

    // Exclude already liked/blocked users
    const sentLikes = await req.prisma.like.findMany({
      where:  { senderId: userId },
      select: { receiverId: true },
    });
    const excludeIds = [userId, ...sentLikes.map(l => l.receiverId)];

    const where = {
      id:     { notIn: excludeIds },
      status: 'active',
    };
    if (req.query.gender) where.gender = req.query.gender;

    const profiles = await req.prisma.user.findMany({
      where, skip, take,
      orderBy: [{ isVerified: 'desc' }, { lastSeen: 'desc' }],
      select: {
        id: true, fullName: true, avatar: true, bio: true,
        gender: true, birthDate: true, location: true,
        isVerified: true, isVip: true,
        albums: { where: { status: 'active' }, take: 6, orderBy: { sortOrder: 'asc' } },
      },
    });

    return success(res, profiles);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /dating/users/:id — view another user's profile ──────────────────────
exports.getUserById = async (req, res) => {
  try {
    const svc  = new UserService(req.prisma);
    const user = await svc.getFullProfile(req.params.id, req.user.id).catch(() => null);
    if (!user || user.status === 'deleted') return notFound(res);
    if (user.status === 'banned') return error(res, 'Tài khoản này đã bị khoá', 403);
    return success(res, user);
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/users/:id/report ─────────────────────────────────────────────
exports.reportUser = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return error(res, 'Lý do báo cáo là bắt buộc', 400);
    const target = await req.prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return notFound(res);
    if (target.id === req.user.id) return error(res, 'Không thể báo cáo chính mình', 400);

    // Store report in notifications (or a dedicated Report table if schema has one)
    await req.prisma.notification.create({
      data: {
        userId:  req.user.id,
        type:    'system',
        title:   `Báo cáo người dùng`,
        content: `Bạn đã báo cáo ${target.fullName || target.id}: ${reason}`,
        project: 'dating',
      },
    }).catch(() => {}); // graceful — notifications table might not exist yet

    return success(res, null, 'Đã gửi báo cáo');
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/users/:id/block ──────────────────────────────────────────────
exports.blockUser = async (req, res) => {
  try {
    const target = await req.prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return notFound(res);
    if (target.id === req.user.id) return error(res, 'Không thể block chính mình', 400);

    // Upsert a "dislike" record to prevent future matching
    await req.prisma.like.upsert({
      where:  { senderId_receiverId: { senderId: req.user.id, receiverId: req.params.id } },
      create: { senderId: req.user.id, receiverId: req.params.id, type: 'dislike' },
      update: { type: 'dislike' },
    });

    // Remove any existing match between the two
    await req.prisma.match.updateMany({
      where: {
        OR: [
          { user1Id: req.user.id, user2Id: req.params.id },
          { user1Id: req.params.id, user2Id: req.user.id },
        ],
        status: { not: 'blocked' },
      },
      data: { status: 'blocked' },
    });

    return success(res, null, 'Đã block người dùng');
  } catch (e) { return error(res, e.message, 500); }
};
