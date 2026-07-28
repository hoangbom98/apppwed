'use strict';
/**
 * dating/controllers/storyController.js
 *
 * Story actions beyond the feed endpoints.
 * DB model: Story (id = CUID string)
 * NOTE: Schema has no StoryView model — view count is tracked via Story.views column.
 */
const { ok, created, error, notFound } = require('../../../shared/utils/network/response');
const StoryService = require('../services/storyService');

exports.getStories = async (req, res) => {
  try {
    const service = new StoryService(req.prisma);
    return ok(res, await service.getStories());
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.createStory = async (req, res) => {
  try {
    const service = new StoryService(req.prisma);
    const result  = await service.createStory(req.user.id, req.body);
    return created(res, result, 'Story created');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

/**
 * POST /dating/stories/:id/view
 * Increments the view counter on the story (idempotent — just increments; no per-user dedup).
 */
exports.viewStory = async (req, res) => {
  try {
    const storyId = req.params.id; // CUID string

    const story = await req.prisma.story.findUnique({ where: { id: storyId } });
    if (!story) return notFound(res, 'Story not found');

    const updated = await req.prisma.story.update({
      where: { id: storyId },
      data:  { views: { increment: 1 } },
    });
    return ok(res, { storyId, views: updated.views });
  } catch (e) {
    return error(res, e.message, 500);
  }
};
