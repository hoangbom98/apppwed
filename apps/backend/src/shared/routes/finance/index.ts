'use strict';
module.exports = {
  payment:        require('./payment.routes'),
  paymentAdmin:   require('./payment-admin.routes'),
  paymentMonitor: require('./payment-monitor.routes'),
  wallet:         require('./wallet.routes'),
};
