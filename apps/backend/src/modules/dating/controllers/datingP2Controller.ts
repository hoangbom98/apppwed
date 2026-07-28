const { success, error } = require('../../../shared/utils/network/response');
const FeedService = require('../services/feedService');
const StoryService = require('../services/storyService');

exports.getFeed = async (req, res) => {
  try {
    const service = new FeedService(req.prisma);
    return success(res, await service.getFeed(req.user.id));
  } catch (e) { return error(res, e.message); }
};

exports.createPost = async (req, res) => {
  try {
    const service = new FeedService(req.prisma);
    return success(res, await service.createPost(req.user.id, req.body), 'Post created', 201);
  } catch (e) { return error(res, e.message); }
};

exports.getStories = async (req, res) => {
  try {
    const service = new StoryService(req.prisma);
    return success(res, await service.getStories());
  } catch (e) { return error(res, e.message); }
};
