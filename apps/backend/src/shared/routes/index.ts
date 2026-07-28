'use strict';
/**
 * shared/routes/index.ts — Barrel re-export for all shared routes.
 *
 * Shared routes are mounted per-project inside each module's routes/index.ts.
 * Usage:
 *   const sharedRoutes = require('@shared/routes');
 *   router.use('/', sharedRoutes.referral);
 *
 * Groups:
 *   auth/     — authentication & identity
 *   finance/  — payments, wallets
 *   user/     — engagement, loyalty, referral
 *   content/  — banners, AI, config
 *   support/  — audit, risk, notifications
 *
 * NOTE: Routes marked [UNMOUNTED] are defined but not yet wired into any
 *       module's router. They should be mounted or removed.
 */

module.exports = {
  // ── Auth & Identity ───────────────────────────────────────────────────
  auth:           require('./auth/auth.routes'),           // mounted: server.ts /api/auth
  configPublic:   require('./content/configPublicRoutes'), // mounted: server.ts /api/shared

  // ── Finance ───────────────────────────────────────────────────────────
  payment:        require('./finance/payment.routes'),         // mounted: game, lkvip
  paymentAdmin:   require('./finance/payment-admin.routes'),   // mounted: admin
  wallet:         require('./finance/wallet.routes'),          // [UNMOUNTED]
  paymentMonitor: require('./finance/payment-monitor.routes'), // [UNMOUNTED]

  // ── User & Engagement ─────────────────────────────────────────────────
  referral:       require('./user/referral.routes'),    // mounted: game, sports, dating, trade
  loyalty:        require('./user/loyalty.routes'),     // mounted: game, sports, dating, trade
  affiliate:      require('./user/affiliate.routes'),   // mounted: game, sports, dating, trade
  leaderboard:    require('./user/leaderboard.routes'), // mounted: game, sports, dating, trade
  campaign:       require('./user/campaign.routes'),    // mounted: game, sports, dating, trade
  push:           require('./user/push.routes'),        // mounted: game, dating
  kyc:            require('./user/kyc.routes'),         // [UNMOUNTED]

  // ── Content ───────────────────────────────────────────────────────────
  banner:         require('./content/banner.routes'),   // [UNMOUNTED]
  ai:             require('./content/ai.routes'),       // mounted: admin

  // ── Support & Compliance ──────────────────────────────────────────────
  support:        require('./support/support.routes'),      // mounted: game, trade, hub
  audit:          require('./support/audit.routes'),        // [UNMOUNTED]
  risk:           require('./support/risk.routes'),         // [UNMOUNTED]
  notification:   require('./support/notification.routes'), // [UNMOUNTED]
};
