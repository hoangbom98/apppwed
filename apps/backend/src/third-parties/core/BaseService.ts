// src/third-parties/core/BaseService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Abstract base for every IService implementation.
//
// The `prisma` parameter in call() must be the *calling module's* Prisma client
// (game_db, sports_db, …). Services that perform wallet operations (balance,
// bet, win) MUST use this client, never a hardcoded project client.
// Services that only make outbound HTTP calls (game launch, price feed, …)
// may ignore the prisma argument.
// ─────────────────────────────────────────────────────────────────────────────

import { IService, ServiceType } from './interfaces';

export abstract class BaseService implements IService {
  constructor(
    public readonly type:         ServiceType,
    public readonly name:         string,
    public readonly providerName: string,
  ) {}

  /**
   * Execute this service.
   * @param payload  Provider-specific request data.
   * @param prisma   Prisma client for the *calling project's* DB.
   *                 Required for any operation that reads/writes user wallet.
   */
  abstract call(payload: unknown, prisma?: unknown): Promise<unknown>;
}
