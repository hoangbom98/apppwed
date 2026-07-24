const { auditService } = require('../services/auditService');

module.exports = async (req, res, next) => {
  if (req.method === 'GET') return next();

  const originalSend = res.send;
  res.send = function (data) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      auditService.log(req.prisma, req.method + ' ' + req.originalUrl, req.user?.id, {
        body: req.body,
        params: req.params,
        statusCode: res.statusCode
      });
    }
    originalSend.call(this, data);
  };
  next();
};
