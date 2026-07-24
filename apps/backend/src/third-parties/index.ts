// src/third-parties/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Root barrel export for the Third-Party Service Layer.
// Import from here to keep import paths stable as the tree grows.
//
// Quick-start (in any module controller):
//
//   import { ServiceRegistry, ServiceType, ConnectionManager } from '../../third-parties';
//   const registry = ServiceRegistry.getInstance();
//   await registry.ensureLoaded();                   // idempotent at startup
//
//   // Simple direct call (game module):
//   const svc = registry.getService('GOLDGATE', ServiceType.GAME_API);
//   const url = await svc.call({ userId, gameCode }, req.prisma);
//
//   // Failover call (will try Goldgate → GSC → TCGaming automatically):
//   const cm = ConnectionManager.getInstance();
//   const result = await cm.callWithFallback({
//     serviceType: ServiceType.GAME_API,
//     payload:     { userId, gameCode },
//     prisma:      req.prisma,   // game_db or sports_db
//     scope:       req.project,  // 'game' | 'sports' | …
//     preferred:   'GOLDGATE',
//   });
// ─────────────────────────────────────────────────────────────────────────────

// Core
export * from './core/index';

// Managers
export { ConnectionManager }  from './managers/ConnectionManager';

// Provider concrete classes (useful for instanceof checks in admin controllers)
export { GoldgateProvider }   from './providers/Goldgate/GoldgateProvider';
export { GSCProvider }        from './providers/GSC/GSCProvider';
export { TCGamingProvider }   from './providers/TCGaming/TCGamingProvider';
export { BinanceProvider }    from './providers/Binance/BinanceProvider';

// Service classes
export { GameApiService as GoldgateGameApiService }  from './providers/Goldgate/services/GameApiService';
export { TurnkeyService as GoldgateTurnkeyService }  from './providers/Goldgate/services/TurnkeyService';
export { GameApiService as GSCGameApiService }        from './providers/GSC/services/GameApiService';
export { LiveStreamService as GSCLiveStreamService }  from './providers/GSC/services/LiveStreamService';
export { GameApiService as TCGameApiService }         from './providers/TCGaming/services/GameApiService';
export { SportsApiService as TCSportsApiService }    from './providers/TCGaming/services/SportsApiService';
export { PriceFeedService as BinancePriceService }   from './providers/Binance/services/PriceFeedService';
export { WalletService as BinanceWalletService }     from './providers/Binance/services/WalletService';
