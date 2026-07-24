// CallService.js
const BaseService = require('../../../shared/services/BaseService');
class CallService extends BaseService {
  constructor(prisma) { super(prisma, 'call'); }
  async getCallHistory(userId) { return this.prisma.call.findMany({ where: { OR: [{ callerId: userId }, { receiverId: userId }] } }); }
}
module.exports = CallService;
