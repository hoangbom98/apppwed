// src/third-parties/providers/TCGaming/services/SportsApiService.ts
// ─────────────────────────────────────────────────────────────────────────────
// TC Gaming sports products:
//   47  = BTI Sports
//   54  = SBO
//   68  = IMSB
//  104  = CMD368
//  131  = PANDA SPORTS
//  151  = UG2 (United Gaming) ← default primary sports product
//
// This service is registered under ServiceType.SPORTS_SOLUTIONS so that the
// sports module can retrieve it independently from casino games.
// All wallet operations delegate to the parent provider (same DB-agnostic logic).
// ─────────────────────────────────────────────────────────────────────────────

import { BaseService }      from '../../../core/BaseService';
import { ServiceType }      from '../../../core/interfaces';
import { TCGamingProvider } from '../TCGamingProvider';

/** Default product code for the sports module (UG2). */
export const DEFAULT_SPORTS_PRODUCT = '151';

export type TCSportsPayload =
  | { action: 'launch';       username: string; productType?: string | number; gameCode?: string; platform?: 'web' | 'h5'; ip?: string; language?: string }
  | { action: 'balance';      username: string; productType?: string | number }
  | { action: 'deposit';      username: string; productType?: string | number; amount: number; referenceNo: string }
  | { action: 'withdraw';     username: string; productType?: string | number; amount: number; referenceNo: string }
  | { action: 'withdrawAll';  username: string; productType?: string | number; referenceNo: string }
  | { action: 'seamless';     method: string; username?: string; transactions?: unknown[] };

export class SportsApiService extends BaseService {
  constructor(private readonly provider: TCGamingProvider) {
    super(ServiceType.SPORTS_SOLUTIONS, 'TCGaming Sports API', 'TCGAMING');
  }

  async call(payload: unknown, prisma?: unknown): Promise<unknown> {
    const p = payload as TCSportsPayload;
    const productType = ('productType' in p ? p.productType : undefined) ?? DEFAULT_SPORTS_PRODUCT;

    switch (p.action) {
      case 'launch':
        return this.provider.launchGame({
          username:    p.username,
          productType,
          gameCode:    ('gameCode' in p ? p.gameCode : undefined) ?? '',
          platform:    ('platform' in p ? p.platform : undefined),
          ip:          ('ip' in p ? p.ip : undefined),
          language:    ('language' in p ? p.language : undefined),
        });

      case 'balance':
        return this.provider.getBalance(p.username, productType);

      case 'deposit':
        const dp = p as Extract<TCSportsPayload, { action: 'deposit' }>;
        return this.provider.fundTransfer(dp.username, productType, '1', dp.amount, dp.referenceNo);

      case 'withdraw':
        const wp = p as Extract<TCSportsPayload, { action: 'withdraw' }>;
        return this.provider.fundTransfer(wp.username, productType, '2', wp.amount, wp.referenceNo);

      case 'withdrawAll':
        const wa = p as Extract<TCSportsPayload, { action: 'withdrawAll' }>;
        return this.provider.transferOutAll(wa.username, productType, wa.referenceNo);

      case 'seamless':
        if (!prisma) throw new Error('TCGaming/sports/seamless: prisma client required');
        return this.provider.handleSeamlessCallback(
          p as { method: string; username?: string; transactions?: unknown[] },
          prisma as Parameters<TCGamingProvider['handleSeamlessCallback']>[1],
        );

      default:
        throw new Error(`TCGaming SportsApiService: unknown action "${(p as Record<string, unknown>)['action']}"`);
    }
  }
}
