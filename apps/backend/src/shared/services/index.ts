// @ts-nocheck
'use strict';
/**
 * shared/services/index.ts — Barrel export for shared services.
 *
 * Import individual services directly for production code:
 *   const cache          = require('./cacheService');
 *   const { runTx }      = require('./transactionService');
 *   const sessionService = require('./sessionService');
 *   const logger         = require('./logger');
 *
 * This barrel is useful for testing mocks and service discovery.
 */

module.exports = {
  aiService: require('./aiService'),                    // ← Groq + DeepSeek + OpenAI
  avatarService: require('./avatarService'),            // ← Dicebear default avatars
  contentModerationService: require('./contentModerationService'), // ← Perspective API
  currencyService: require('./currencyService'),        // ← Multi-currency engine
  analyticsService: require('./analyticsService'),      // ← Tầng 6: cross-project analytics
  archiveService: require('./archiveService'),          // ← Tầng 2: cold storage
  auditService: require('./auditService'),
  authService: require('./authService'),
  bannerService: require('./bannerService'),
  cacheService: require('./cacheService'),
  configService: require('./configService'),
  emailGuardService: require('./emailGuardService'),    // ← Disify disposable email filter
  emailService: require('./emailService'),
  exportService: require('./exportService'),
  ipGuardService: require('./ipGuardService'),          // ← AbuseIPDB + ipapi.co geo
  kycService: require('./kycService'),
  logger: require('./logger'),
  loyaltyService: require('./loyaltyService'),
  notificationService: require('./notificationService'),
  paymentService: require('./paymentService'),
  pushService: require('./pushService'),
  queueService: require('./queueService'),
  referralService: require('./referralService'),
  riskService: require('./riskService'),
  sessionService: require('./sessionService'),          // ← Redis-backed sessions
  smsService: require('./smsService'),
  socketService: require('./socketService'),
  storageAdapter: require('./storageAdapter'),
  supportChatService: require('./supportChatService'),
  supportService: require('./supportService'),
  telegramAlertService: require('./telegramAlertService'), // ← Telegram admin alerts
  ticketService: require('./ticketService'),
  transactionService: require('./transactionService'),  // ← Prisma $transaction helper
  translationService: require('./translationService'),
  twoFactorService: require('./twoFactorService'),
  uploadService: require('./uploadService'),
  walletService: require('./walletService'),
};
