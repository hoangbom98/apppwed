// src/third-parties/providers/Binance/services/WalletService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Binance spot wallet (authenticated) — account balance, withdrawal.
// Used by the trade module for crypto deposit/withdrawal flows.
// Requires apiKey + secretKey in the aggregator config.
// ─────────────────────────────────────────────────────────────────────────────

import { BaseService }    from '../../../core/BaseService';
import { ServiceType }    from '../../../core/interfaces';
import { BinanceProvider } from '../BinanceProvider';

export type BinanceWalletPayload =
  | { action: 'accountInfo' }
  | { action: 'assetBalance'; asset: string }
  | { action: 'withdraw';     coin: string; address: string; amount: number; network?: string }
  | { action: 'depositAddress'; coin: string; network?: string };

export class WalletService extends BaseService {
  constructor(private readonly provider: BinanceProvider) {
    super(ServiceType.WALLET, 'Binance Wallet', 'BINANCE');
  }

  async call(payload: unknown, _prisma?: unknown): Promise<unknown> {
    const p = payload as BinanceWalletPayload;

    switch (p.action) {
      case 'accountInfo':
        return this.provider.callSigned('GET', '/api/v3/account');

      case 'assetBalance': {
        const info = await this.provider.callSigned<{ balances: { asset: string; free: string; locked: string }[] }>(
          'GET', '/api/v3/account',
        );
        const found = info.balances.find((b) => b.asset === p.asset.toUpperCase());
        return found ? { free: parseFloat(found.free), locked: parseFloat(found.locked) } : { free: 0, locked: 0 };
      }

      case 'withdraw':
        return this.provider.callSigned('POST', '/sapi/v1/capital/withdraw/apply', {
          coin:    p.coin,
          address: p.address,
          amount:  p.amount,
          network: p.network,
        });

      case 'depositAddress':
        return this.provider.callSigned('GET', '/sapi/v1/capital/deposit/address', {
          coin:    p.coin,
          network: p.network,
        });

      default:
        throw new Error(`Binance WalletService: unknown action "${(p as Record<string, unknown>)['action']}"`);
    }
  }
}
