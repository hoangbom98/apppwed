// LiveService.js
const BaseService = require('../../../shared/services/BaseService');
class LiveService extends BaseService {
  constructor(prisma) { super(prisma, 'liveStream'); }
  async getActiveStreams() { return this.prisma.liveStream.findMany({ where: { status: 'live' } }); }
}
module.exports = LiveService;
