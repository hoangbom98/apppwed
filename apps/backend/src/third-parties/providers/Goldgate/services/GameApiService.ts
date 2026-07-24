// src/third-parties/providers/Goldgate/services/GameApiService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Goldgate game launch + seamless wallet callbacks.
// Used by game module AND sports module — `prisma` decides which DB is touched.
// ─────────────────────────────────────────────────────────────────────────────

import { BaseService }     from '../../../core/BaseService';
import { ServiceType }     from '../../../core/interfaces';
import { GoldgateProvider } from '../GoldgateProvider';

export interface GoldgateLaunchPayload {
  userId:      string | number;
  gameCode:    string;
  vendorCode?: string;
}

export interface GoldgateBalancePayload {
  action:   'balance';
  userCode: string;
}

export interface GoldgateTxPayload {
  action:        'transaction';
  userCode:      string;
  transactionId: string;
  roundId?:      string;
  txType:        string;
  amount:        number | string;
  gameCode?:     string;
}

export type GoldgatePayload =
  | GoldgateLaunchPayload
  | GoldgateBalancePayload
  | GoldgateTxPayload;

export class GameApiService extends BaseService {
  constructor(private readonly provider: GoldgateProvider) {
    super(ServiceType.GAME_API, 'Goldgate Game API', 'GOLDGATE');
  }

  /**
   * Route to the correct handler based on `action` field.
   *
   * @param payload  GoldgatePayload — discriminated by `.action`
   * @param prisma   Calling module's Prisma client (game_db or sports_db).
   *                 Required for balance/transaction actions.
   */
  async call(payload: unknown, prisma?: unknown): Promise<unknown> {
    const p = payload as GoldgatePayload;

    // Discriminate by `action`; absence → game launch
    if (!('action' in p)) {
      const lp = p as GoldgateLaunchPayload;
      return this.provider.launchGame(lp.userId, lp.gameCode, lp.vendorCode);
    }

    if (p.action === 'balance') {
      if (!prisma) throw new Error('Goldgate/balance: prisma client required');
      return this.provider.handleBalance(p.userCode, prisma as Parameters<GoldgateProvider['handleBalance']>[1]);
    }

    if (p.action === 'transaction') {
      if (!prisma) throw new Error('Goldgate/transaction: prisma client required');
      const tp = p as GoldgateTxPayload;
      return this.provider.handleTransaction(
        {
          userCode:      tp.userCode,
          transactionId: tp.transactionId,
          roundId:       tp.roundId,
          txType:        tp.txType,
          amount:        tp.amount,
          gameCode:      tp.gameCode,
        },
        prisma as Parameters<GoldgateProvider['handleTransaction']>[1],
      );
    }

    throw new Error(`Goldgate GameApiService: unknown action "${(p as Record<string, unknown>)['action']}"`);
  }

  /** Expose RTP adjustment directly on the service for admin controllers. */
  async adjustRTP(gameId: string, rtp: number): Promise<unknown> {
    return this.provider.setRTP(gameId, rtp);
  }
}
