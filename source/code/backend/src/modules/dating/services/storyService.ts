// StoryService.js
const BaseService = require('../../../shared/services/BaseService');
class StoryService extends BaseService {
  constructor(prisma) { super(prisma, 'story'); }
  async getStories() { return this.prisma.story.findMany({ where: { expiresAt: { gt: new Date() } } }); }
  async createStory(userId, data) { return this.prisma.story.create({ data: { userId, ...data, expiresAt: new Date(Date.now() + 86400000) } }); }
}
module.exports = StoryService;
