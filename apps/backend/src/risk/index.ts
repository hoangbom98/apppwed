// @ts-nocheck
'use strict';
/**
 * risk/index.ts — Barrel export for the Risk Detection Engine.
 * All detectors and monitors are CommonJS modules.
 */

module.exports = {
  AdaptiveLimits:      require('./adaptiveLimits'),
  AlertHelper:         require('./alertHelper'),
  BotDetector:         require('./botDetector'),
  BruteForceDetector:  require('./bruteForceDetector'),
  ComplianceMonitor:   require('./complianceMonitor'),
  ContentModerator:    require('./contentModerator'),
  DdosDetector:        require('./ddosDetector'),
  DeviceFingerprint:   require('./deviceFingerprint'),
  FraudDetector:       require('./fraudDetector'),
  GeolocationMonitor:  require('./geolocationMonitor'),
  RiskScorer:          require('./riskScorer'),
  SecurityMonitor:     require('./securityMonitor'),
  TransactionMonitor:  require('./transactionMonitor'),
};
