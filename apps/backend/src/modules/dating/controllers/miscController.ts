// @ts-nocheck
'use strict';
/**
 * dating/controllers/miscController.js
 *
 * Misc endpoints that use the dating schema only.
 * Dating schema models available: User, Like, Match, Follow, Album, AlbumPhoto,
 *   Gift, GiftSend, Transaction, VipPlan, VipMembership, LiveStream, Story, ...
 *
 * NOT available in dating schema: shopItem, userItem, event, communityPost,
 *   partyRoom — those don't exist. Stubs return empty arrays gracefully.
 * User fields: id, fullName, username, avatar, birthDate, location, coins,
 *   isVerified, isVip, status, lastSeen — NO isOnline, displayName, referrerId, referralCode
 * Album fields: id(cuid), userId, name, cover, visibility, status, photoCount
 *   — NOT url/type/isPrivate
 * Like fields: senderId, receiverId — NOT toUserId/fromUserId
 */
const { success, error } = require('../../../shared/utils/response');
const { paginate } = require('../../../shared/utils/helpers');

// ── GET /dating/search ────────────────────────────────────────────────────────
exports.search = async (req, res) => {
  try {
    const { q, type } = req.query;
    if (!q || q.length < 2) return success(res, { results: [] });
    const kw = { contains: q };
    let results = [];
    if (!type || type === 'users') {
      const users = await req.prisma.user.findMany({
        where:  { status: 'active', fullName: kw },
        take:   20,
        select: { id: true, fullName: true, avatar: true, birthDate: true, location: true, lastSeen: true },
      });
      results = users.map(u => ({
        ...u,
        age:  u.birthDate ? Math.floor((Date.now() - new Date(u.birthDate)) / (1000 * 60 * 60 * 24 * 365.25)) : null,
        city: typeof u.location === 'string' ? u.location : (u.location?.city || ''),
      }));
    }
    return success(res, { results });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /dating/vip-plans ─────────────────────────────────────────────────────
exports.getVipPlans = async (req, res) => {
  try {
    const plans = await req.prisma.vipPlan.findMany({
      where:   { status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });
    return success(res, { plans });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /dating/shop — shop items (schema stub: no ShopItem model in dating) ──
exports.getShopItems = async (req, res) => {
  // Dating schema does not have a ShopItem model — return gifts as shop items instead
  try {
    const where = { status: 'active' };
    if (req.query.category) where.category = req.query.category;
    const items = await req.prisma.gift.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
    return success(res, { items });
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/shop/buy — buy a gift item ───────────────────────────────────
exports.buyItem = async (req, res) => {
  // Gift.id is CUID string — never parseInt
  try {
    const gift = await req.prisma.gift.findUnique({ where: { id: String(req.body.item_id) } });
    if (!gift) return error(res, 'Không tìm thấy', 400);
    const u = await req.prisma.user.findUnique({ where: { id: req.user.id } });
    if (parseFloat(u.coins) < parseFloat(gift.coinCost)) return error(res, 'Không đủ xu', 400);
    await req.prisma.user.update({
      where: { id: req.user.id },
      data:  { coins: { decrement: parseFloat(gift.coinCost) } },
    });
    return success(res, null, 'Mua thành công');
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /dating/profile/stats ─────────────────────────────────────────────────
// Like.receiverId (not toUserId), Follow.followingId
exports.getProfileStats = async (req, res) => {
  try {
    const uid = req.user.id;
    const [likes_received, matches, followers] = await Promise.all([
      req.prisma.like.count({ where: { receiverId: uid } }).catch(() => 0),
      req.prisma.match.count({ where: { OR: [{ user1Id: uid }, { user2Id: uid }], status: 'matched' } }).catch(() => 0),
      req.prisma.follow.count({ where: { followingId: uid } }).catch(() => 0),
    ]);
    return success(res, { stats: { likes_received, matches, followers } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── DELETE /dating/album/:id ──────────────────────────────────────────────────
// Album.id is CUID string — never parseInt
exports.deletePhoto = async (req, res) => {
  try {
    const photo = await req.prisma.albumPhoto.findFirst({
      where: { id: String(req.params.id) },
      include: { album: { select: { userId: true } } },
    });
    if (!photo || photo.album.userId !== req.user.id) return error(res, 'Không tìm thấy ảnh', 404);
    await req.prisma.albumPhoto.delete({ where: { id: photo.id } });
    return success(res, null, 'Đã xóa ảnh');
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /dating/album/:userId ─────────────────────────────────────────────────
// userId is CUID string — never parseInt
// Album.visibility values: public | friends | private (not isPrivate boolean)
exports.getAlbum = async (req, res) => {
  try {
    const uid   = req.params.userId === 'me' ? req.user.id : String(req.params.userId);
    const isOwn = uid === req.user.id;
    const where = { userId: uid, status: 'active' };
    if (!isOwn) where.visibility = 'public';
    const albums = await req.prisma.album.findMany({
      where,
      orderBy:  { createdAt: 'asc' },
      include:  { photos: { orderBy: { sortOrder: 'asc' } } },
    });
    return success(res, { albums });
  } catch (e) { return error(res, e.message, 500); }
};

// ── POST /dating/album/upload — upload a photo to an album ────────────────────
// Album schema: { id, userId, name, description, cover, visibility, status }
// AlbumPhoto schema: { id, albumId, url, caption, sortOrder }
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return error(res, 'Không có file', 400);
    const { saveImage } = require('../../../shared/services/uploadService');
    const url = await saveImage(req.file.buffer, 'dating/albums');

    // Find or create default album for this user
    let album = await req.prisma.album.findFirst({
      where: { userId: req.user.id, name: 'Ảnh của tôi' },
    });
    if (!album) {
      album = await req.prisma.album.create({
        data: { userId: req.user.id, name: 'Ảnh của tôi', visibility: 'public' },
      });
    }

    const photo = await req.prisma.albumPhoto.create({
      data: { albumId: album.id, url },
    });
    return success(res, photo);
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /dating/events ────────────────────────────────────────────────────────
exports.getEvents = async (req, res) => {
  try {
    const now = new Date();
    const events = await req.prisma.datingEvent.findMany({
      where:   { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { startsAt: 'asc' },
    });
    return success(res, { events });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /dating/community ─────────────────────────────────────────────────────
// Dating schema has no CommunityPost model — return posts from Post model instead
exports.getCommunityPosts = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where = { status: 'active' };
    const [posts, total] = await Promise.all([
      req.prisma.post.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      req.prisma.post.count({ where }),
    ]);
    return res.json({ success: true, posts, meta: { total, page, limit } });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /dating/party-rooms ───────────────────────────────────────────────────
// Dating schema has no PartyRoom model — return live streams instead
exports.getPartyRooms = async (req, res) => {
  try {
    const streams = await req.prisma.liveStream.findMany({
      where:   { status: 'live' },
      orderBy: { viewerCount: 'desc' },
      include: { user: { select: { id: true, fullName: true, avatar: true } } },
    });
    return success(res, { rooms: streams.map(s => ({ ...s, host: s.user })) });
  } catch (e) { return error(res, e.message, 500); }
};

// ── GET /dating/referral ──────────────────────────────────────────────────────
// Dating User has no referralCode or referrerId fields — return stub
exports.getReferral = async (req, res) => {
  return success(res, { code: null, total_referrals: 0, total_earnings: 0 });
};

exports.getReferralHistory = async (req, res) => {
  return success(res, { history: [] });
};
