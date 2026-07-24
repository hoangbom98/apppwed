// src/third-parties/providers/Goldgate/services/TurnkeyService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Goldgate Turnkey — white-label casino / sports solution launch.
// Delegates to the same launch flow as GameApiService but is registered
// under ServiceType.TURNKEY so it can be selected independently.
// ─────────────────────────────────────────────────────────────────────────────

import { BaseService }     from '../../../core/BaseService';
import { ServiceType }     from '../../../core/interfaces';
import { GoldgateProvider } from '../GoldgateProvider';

export class TurnkeyService extends BaseService {
  constructor(private readonly provider: GoldgateProvider) {
    super(ServiceType.TURNKEY, 'Goldgate Turnkey', 'GOLDGATE');
  }

  async call(
    payload: { userId: string | number; vendorCode: string; gameCode?: string },
    _prisma?: unknown,
  ): Promise<unknown> {
    return this.provider.launchGame(
      payload.userId,
      payload.gameCode ?? payload.vendorCode,
      payload.vendorCode,
    );
  }
}
