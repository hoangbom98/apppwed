// src/third-parties/providers/TCGaming/services/GameApiService.ts
// ─────────────────────────────────────────────────────────────────────────────
// TC Gaming casino games (CQ9, PG Soft, JILI, Evolution …).
// Supports both TRANSFER wallet and SEAMLESS wallet models.
// ─────────────────────────────────────────────────────────────────────────────

import { BaseService }      from '../../../core/BaseService';
import { ServiceType }      from '../../../core/interfaces';
import { TCGamingProvider } from '../TCGamingProvider';

export type TCGamePayload =
  | { action: 'launch';    username: string; productType: string | number; gameCode?: string; platform?: 'web' | 'h5'; ip?: string; language?: string }
  | { action: 'balance';   username: string; productType: string | number }
  | { action: 'transfer';  username: string; productType: string | number; fundType: '1' | '2'; amount: number; referenceNo: string }
  | { action: 'transferOutAll'; username: string; productType: string | number; referenceNo: string }
  | { action: 'seamless';  method: string; username?: string; transactions?: unknown[] };

export class GameApiService extends BaseService {
  constructor(private readonly provider: TCGamingProvider) {
    super(ServiceType.GAME_API, 'TCGaming Game API', 'TCGAMING');
  }

  async call(payload: unknown, prisma?: unknown): Promise<unknown> {
    const p = payload as TCGamePayload;

    switch (p.action) {
      case 'launch':
        return this.provider.launchGame(p);

      case 'balance':
        return this.provider.getBalance(p.username, p.productType);

      case 'transfer':
        return this.provider.fundTransfer(
          p.username, p.productType, p.fundType, p.amount, p.referenceNo,
        );

      case 'transferOutAll':
        return this.provider.transferOutAll(p.username, p.productType, p.referenceNo);

      case 'seamless':
        if (!prisma) throw new Error('TCGaming/seamless: prisma client required');
        return this.provider.handleSeamlessCallback(
          p as { method: string; username?: string; transactions?: unknown[] },
          prisma as Parameters<TCGamingProvider['handleSeamlessCallback']>[1],
        );

      default:
        throw new Error(`TCGaming GameApiService: unknown action "${(p as Record<string, unknown>)['action']}"`);
    }
  }
}
