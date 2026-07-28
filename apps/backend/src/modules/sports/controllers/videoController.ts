'use strict';
const { success, created, error } = require('../../../shared/utils/network/response');
const { paginate } = require('../../../shared/utils/core/helpers');

exports.list = async (req, res) => {
  try {
    const { skip, take, page, limit } = paginate(req.query.page, 20);
    const where = { status: 'active' };

    const [videos, total] = await Promise.all([
      req.prisma.shortVideo.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } },
      }),
      req.prisma.shortVideo.count({ where }),
    ]);

    return res.json({ success: true, videos, meta: { total, page, limit } });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.get = async (req, res) => {
  try {
    const id = req.params.id; // CUID string — no coercion
    const video = await req.prisma.shortVideo.findUnique({
      where:   { id },
      include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } },
    });

    if (!video) return error(res, 'Video not found', 404);

    // Increment views
    await req.prisma.shortVideo.update({
      where: { id: video.id },
      data:  { views: { increment: 1 } },
    });

    return success(res, { ...video, views: video.views + 1 });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, videoUrl, thumbnail, duration } = req.body;
    if (!videoUrl) return error(res, 'videoUrl is required');

    const video = await req.prisma.shortVideo.create({
      data: {
        userId:    req.user.id,
        title,
        description,
        videoUrl,
        thumbnail,
        duration:  duration ? parseInt(duration, 10) : null, // duration is an integer (seconds)
      },
    });

    return created(res, video);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.like = async (req, res) => {
  try {
    const id = req.params.id; // CUID string — no coercion
    await req.prisma.shortVideo.update({
      where: { id },
      data:  { likes: { increment: 1 } },
    });
    return success(res, null, 'Liked');
  } catch (e) {
    return error(res, e.message, 500);
  }
};
