// src/third-parties/providers/Binance/BinanceProvider.ts
// ─────────────────────────────────────────────────────────────────────────────
// Binance public API — price feed and spot wallet.
// Scope: trade + sports (and any module that needs live crypto prices).
//
// Note: No credentials are needed for the public price-feed endpoints.
// The apiKey/secretKey in gameAggregator config are used for authenticated
// wallet/order endpoints.
// ─────────────────────────────────────────────────────────────────────────────

import { BaseProvider }   from '../../core/BaseProvider';
import { ServiceType, IAggregatorConfig } from '../../core/interfaces';
import { PriceFeedService } from './services/PriceFeedService';
import { WalletService }    from './services/WalletService';

export class BinanceProvider extends BaseProvider {
  constructor(cfg: IAggregatorConfig) {
    // trade + sports (live sport price feeds)
    super('BINANCE', cfg, ['trade', 'sports', '*']);
  }

  protected registerServices(): void {
    this.services.set(ServiceType.PRICE_FEED, new PriceFeedService(this));
    this.services.set(ServiceType.WALLET,     new WalletService(this));
  }

  // ── Signed request helper ─────────────────────────────────────────────────

  /**
   * For authenticated Binance endpoints that require HMAC-SHA256 signature.
   * Not needed for public price-feed calls.
   */
  async callSigned<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path:   string,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    const timestamp = Date.now();
    const query     = new URLSearchParams({
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
      timestamp: String(timestamp),
    });

    const crypto = await import('crypto');
    const sig = crypto
      .createHmac('sha256', this.credential.secretKey ?? '')
      .update(query.toString())
      .digest('hex');
    query.append('signature', sig);

    const url = `${path}?${query.toString()}`;
    return this.callApi<T>({
      method,
      url,
      headers: { 'X-MBX-APIKEY': this.credential.apiKey ?? '' },
    });
  }
}
