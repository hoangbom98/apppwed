// src/third-parties/providers/Goldgate/GoldgateProvider.ts
// ─────────────────────────────────────────────────────────────────────────────
// Goldgate Aggregator — connects to 150+ game vendors (Evolution, PG Soft,
// JDB, SBO, JILI, CQ9 …). Scope: game + sports.
//
// Wallet model: SEAMLESS
//   Goldgate calls /goldgate/api/balance and /goldgate/api/transaction on our
//   server. The controller passes req.prisma (game_db or sports_db) so that
//   these callbacks always debit/credit the correct project's user table.
//
// RTP: Goldgate exposes POST /rtp to set game-level RTP per operator.
// ─────────────────────────────────────────────────────────────────────────────

import { BaseProvider }   from '../../core/BaseProvider';
import { ServiceType, IAggregatorConfig } from '../../core/interfaces';
import { GameApiService } from './services/GameApiService';
import { TurnkeyService } from './services/TurnkeyService';

export class GoldgateProvider extends BaseProvider {
  /** In-memory token cache (cleared on expiry). */
  _token:       string | null = null;
  _tokenExpiry: number        = 0;

  constructor(cfg: IAggregatorConfig) {
    // game + sports — one credential set serves both projects
    super('GOLDGATE', cfg, ['game', 'sports', '*']);
  }

  protected registerServices(): void {
    this.services.set(ServiceType.GAME_API,       new GameApiService(this));
    this.services.set(ServiceType.TURNKEY,         new TurnkeyService(this));
    this.services.set(ServiceType.SPORTS_SOLUTIONS, new GameApiService(this)); // sports uses same launch flow
    this.services.set(ServiceType.RTP_ADJUSTABLE,  new GameApiService(this)); // RTP via adjustRTP()
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async getToken(): Promise<string> {
    if (this._token && Date.now() < this._tokenExpiry) return this._token!;

    const res = await this.callApi<{ token: string; expiration?: number }>({
      method: 'POST',
      url:    '/auth/createtoken',
      data: {
        clientId:     this.credential.apiKey,
        clientSecret: this.credential.secretKey,
      },
    });

    if (!res.token) throw new Error('Goldgate: failed to obtain auth token');
    this._token       = res.token;
    this._tokenExpiry = ((res.expiration ?? Math.floor(Date.now() / 1000) + 3600)) * 1000;
    this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${this._token}`;
    return this._token!;
  }

  // ── Game / Sports launch ──────────────────────────────────────────────────

  /**
   * Launch a game or sports betting page and return the URL.
   * Works identically for game_db and sports_db callers.
   *
   * @param userId     – project-local user ID (string or number)
   * @param gameCode   – Goldgate game code (for sports: product code)
   * @param vendorCode – e.g. 'JILI', 'PG', 'SPORTS'
   */
  async launchGame(
    userId: string | number,
    gameCode: string,
    vendorCode?: string,
  ): Promise<{ sessionId: string; gameUrl: string; expiresAt: Date }> {
    await this.getToken();

    const res = await this.callApi<{ message?: string; url?: string }>({
      method: 'POST',
      url:    '/game/launch-url',
      data: {
        vendorCode: vendorCode || gameCode.split('_')[0],
        gameCode,
        userCode:   String(userId),
        language:   (this.config as Record<string, unknown>)['language'] as string ?? 'vi',
        lobbyUrl:   (this.config as Record<string, unknown>)['lobbyUrl'] as string ?? '',
        theme:      1,
      },
    });

    return {
      sessionId: `gg_${Date.now()}`,
      gameUrl:   res.message ?? res.url ?? '',
      expiresAt: new Date(Date.now() + 3_600_000),
    };
  }

  // ── Seamless wallet callbacks ─────────────────────────────────────────────
  // `prisma` is always the calling module's client — NEVER hardcoded here.

  async handleBalance(
    userCode: string,
    prisma: { user: { findUnique: Function } },
  ): Promise<{ code: number; balance: number; message?: string }> {
    const userId = parseInt(userCode) || userCode;
    const user   = await prisma.user.findUnique({
      where:  { id: userId },
      select: { balance: true },
    });
    if (!user) return { code: 1, message: 'Player not found', balance: 0 };
    return { code: 0, balance: Number(user.balance) };
  }

  async handleTransaction(
    payload: {
      userCode:        string;
      transactionId:   string;
      roundId?:        string;
      txType:          string;
      amount:          number | string;
      gameCode?:       string;
    },
    prisma: { user: { findUnique: Function; update: Function }; transaction: { findFirst: Function; create: Function }; $transaction: Function },
  ): Promise<{ code: number; balance: number; message?: string }> {
    const { userCode, transactionId, roundId, txType, amount, gameCode } = payload;
    const userId = parseInt(userCode) || userCode;
    const amt    = Math.abs(Number(amount));

    // Idempotency — same transactionId → return current balance
    const existing = await prisma.transaction.findFirst({
      where: { referenceId: String(transactionId), referenceType: 'gg_tx' },
    });
    if (existing) {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true } });
      return { code: 0, balance: Number(u?.balance ?? 0), message: 'already processed' };
    }

    const result = await prisma.$transaction(async (tx: typeof prisma) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { balance: true } });
      if (!user) throw new Error('Player not found');

      const isBet = ['BET', 'DEBIT'].includes(txType?.toUpperCase());
      if (isBet && Number(user.balance) < amt) throw new Error('Insufficient balance');

      const updated = await tx.user.update({
        where:  { id: userId },
        data:   { balance: isBet ? { decrement: amt } : { increment: amt } },
        select: { balance: true },
      });

      await tx.transaction.create({
        data: {
          userId,
          type:          isBet ? 'bet' : txType.toLowerCase(),
          amount:        isBet ? -amt : amt,
          balanceAfter:  Number(updated.balance),
          referenceId:   String(transactionId),
          referenceType: 'gg_tx',
          note:          `Goldgate ${txType} gameCode=${gameCode} round=${roundId}`,
        },
      });

      return { balance: Number(updated.balance) };
    });

    return { code: 0, balance: result.balance };
  }

  // ── RTP (Goldgate-specific) ───────────────────────────────────────────────

  /**
   * Adjust the Return-To-Player percentage for a specific game.
   * Only Goldgate supports this; call via the admin panel.
   */
  async setRTP(gameId: string, rtp: number): Promise<unknown> {
    await this.getToken();
    return this.callApi({
      method: 'POST',
      url:    '/rtp',
      data:   { gameId, rtp },
    });
  }
}
