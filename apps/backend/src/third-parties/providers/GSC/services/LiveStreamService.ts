// src/third-parties/providers/GSC/services/LiveStreamService.ts
// ─────────────────────────────────────────────────────────────────────────────
// GSC Super Lobby / Live Stream launch.
// Launches the full GSC lobby (all products) rather than a single game.
// ─────────────────────────────────────────────────────────────────────────────

import { BaseService } from '../../../core/BaseService';
import { ServiceType } from '../../../core/interfaces';
import { GSCProvider } from '../GSCProvider';

export class LiveStreamService extends BaseService {
  constructor(private readonly provider: GSCProvider) {
    super(ServiceType.LIVE_STREAM, 'GSC Live Stream / Super Lobby', 'GSC');
  }

  async call(
    payload: { userId: string | number; language?: string; isMobile?: boolean; lobbyUrl?: string },
    _prisma?: unknown,
  ): Promise<unknown> {
    // productId = 0 → GSC Super Lobby (all vendors)
    return this.provider.launchGame({
      userId:    payload.userId,
      productId: 0,
      gameCode:  '',
      language:  payload.language,
      isMobile:  payload.isMobile,
      lobbyUrl:  payload.lobbyUrl,
    });
  }
}
