const { success, error } = require('../../../shared/utils/network/response');
const LiveService = require('../services/liveService');
const CallService = require('../services/callService');

exports.getActive = async (req, res) => {
  try {
    const service = new LiveService(req.prisma);
    return success(res, await service.getActiveStreams());
  } catch (e) { return error(res, e.message); }
};

exports.getHistory = async (req, res) => {
  try {
    const service = new CallService(req.prisma);
    return success(res, await service.getCallHistory(req.user.id));
  } catch (e) { return error(res, e.message); }
};
