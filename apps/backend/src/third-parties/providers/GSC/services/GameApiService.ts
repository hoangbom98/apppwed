// src/third-parties/providers/GSC/services/GameApiService.ts
// ─────────────────────────────────────────────────────────────────────────────
// GSC game launch + seamless wallet callbacks.
// Works for game_db (casino) and sports_db (SBO / sports products).
// ─────────────────────────────────────────────────────────────────────────────

import { BaseService } from '../../../core/BaseService';
import { ServiceType } from '../../../core/interfaces';
import { GSCProvider } from '../GSCProvider';

export type GSCPayload =
  | { action: 'launch';      userId: string | number; productId: number | string; gameCode?: string; language?: string; isMobile?: boolean }
  | { action: 'balance';     userId: string;  operatorCode: string }
  | { action: 'transaction'; userId: string;  transactionId: string; txType: 'bet' | 'win' | 'refund' | 'cancel'; amount: number | string; roundId?: string; productId?: number | string; gameCode?: string }

export class GameApiService extends BaseService {
  constructor(private readonly provider: GSCProvider) {
    super(ServiceType.GAME_API, 'GSC Game API', 'GSC');
  }

  async call(payload: unknown, prisma?: unknown): Promise<unknown> {
    const p = payload as GSCPayload;

    switch (p.action) {
      case 'launch':
        return this.provider.launchGame(p);

      case 'balance':
        if (!prisma) throw new Error('GSC/balance: prisma client required');
        return this.provider.handleBalance(p, prisma as Parameters<GSCProvider['handleBalance']>[1]);

      case 'transaction':
        if (!prisma) throw new Error('GSC/transaction: prisma client required');
        return this.provider.handleTransaction(p, prisma as Parameters<GSCProvider['handleTransaction']>[1]);

      default:
        throw new Error(`GSC GameApiService: unknown action "${(p as Record<string, unknown>)['action']}"`);
    }
  }
}
