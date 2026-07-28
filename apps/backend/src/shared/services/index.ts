// @ts-nocheck
'use strict';
/**
 * shared/services/index.ts — Barrel export for all shared services.
 *
 * Grouped by domain. Import individual services directly in production code:
 *   const cache   = require('./core/cacheService');
 *   const logger  = require('./core/logger');
 *   const auth    = require('./auth/authService');
 *
 * This barrel is useful for testing mocks and service discovery.
 */

// ── Core Infrastructure ────────────────────────────────────────────────────
module.exports = {
  // core
  BaseService:           require('./core/BaseService'),
  cacheService:          require('./core/cacheService'),
  configService:         require('./core/configService'),
  exportService:         require('./core/exportService'),
  logger:                require('./core/logger'),
  queueService:          require('./core/queueService'),
  sessionService:        require('./core/sessionService'),
  socketService:         require('./core/socketService'),
  storageAdapter:        require('./core/storageAdapter'),
  translationService:    require('./core/translationService'),
  uploadService:         require('./core/uploadService'),
  whiteLabelService:     require('./core/whiteLabelService'),

  // auth
  authService:           require('./auth/authService'),
  twoFactorService:      require('./auth/twoFactorService'),

  // communication
  emailService:          require('./communication/emailService'),
  notificationService:   require('./communication/notificationService'),
  pushService:           require('./communication/pushService'),
  smsService:            require('./communication/smsService'),
  socketServiceComm:     require('./communication/socketService'),
  supportChatService:    require('./communication/supportChatService'),
  telegramAlertService:  require('./communication/telegramAlertService'),

  // content
  analyticsService:      require('./content/analyticsService'),
  avatarService:         require('./content/avatarService'),
  bannerService:         require('./content/bannerService'),
  cmsService:            require('./content/cmsService'),
  contentModerationService: require('./content/contentModerationService'),
  uploadServiceContent:  require('./content/uploadService'),

  // finance
  archiveService:        require('./finance/archiveService'),
  currencyService:       require('./finance/currencyService'),
  ledgerService:         require('./finance/ledgerService'),
  loyaltyService:        require('./finance/loyaltyService'),
  paymentService:        require('./finance/paymentService'),
  rebateService:         require('./finance/rebateService'),
  referralService:       require('./user/referralService'),
  settlementService:     require('./finance/settlementService'),
  transactionService:    require('./finance/transactionService'),
  walletService:         require('./finance/walletService'),

  // support
  auditService:          require('./support/auditService'),
  emailGuardService:     require('./support/emailGuardService'),
  ipGuardService:        require('./support/ipGuardService'),
  kycService:            require('./support/kycService'),
  riskCheck:             require('./support/riskCheck.service'),
  riskService:           require('./support/riskService'),
  supportService:        require('./support/supportService'),
  taskService:           require('./user/taskService'),
  ticketService:         require('./support/ticketService'),

  // user
  vipEngineService:      require('./user/vipEngineService'),

  // ai
  aiService:             require('./ai/aiService'),

  // aggregators
  aggregators:           require('./aggregators'),
};
