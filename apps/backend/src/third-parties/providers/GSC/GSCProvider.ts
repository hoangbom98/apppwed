// src/third-parties/providers/GSC/GSCProvider.ts
// ─────────────────────────────────────────────────────────────────────────────
// GSC Plus Aggregator (v2.0.6).
// Scope: game + sports (sports uses the same operatorCode, different products).
//
// Wallet model: SEAMLESS (GSC calls /gsc/seamless/* on our server).
// Auth: HMAC-SHA256 signature on every request.
// Products: CQ9 (1009), PG Soft (1007), JILI (1016), SBO Sports (1005), …
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto';
import { BaseProvider }  from '../../core/BaseProvider';
import { ServiceType, IAggregatorConfig } from '../../core/interfaces';
import { GameApiService }    from './services/GameApiService';
import { LiveStreamService } from './services/LiveStreamService';

export class GSCProvider extends BaseProvider {
  private operatorCode: string;
  private secretKey:    string;

  constructor(cfg: IAggregatorConfig) {
    super('GSC', cfg, ['game', 'sports', '*']);
    this.operatorCode = cfg.apiKey;       // agentCode in GSC docs
    this.secretKey    = cfg.secretKey;    // agentToken in GSC docs
  }

  protected registerServices(): void {
    this.services.set(ServiceType.GAME_API,         new GameApiService(this));
    this.services.set(ServiceType.SPORTS_SOLUTIONS,  new GameApiService(this)); // same flow, different productId
    this.services.set(ServiceType.LIVE_STREAM,       new LiveStreamService(this));
  }

  // ── Signing ───────────────────────────────────────────────────────────────

  /** HMAC-SHA256(requestTime + action, secretKey) → hex */
  sign(requestTime: number, action: string): string {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(`${requestTime}${action}`)
      .digest('hex');
  }

  private _ts(): number { return Math.floor(Date.now() / 1000); }

  private _base(action: string): Record<string, unknown> {
    const requestTime = this._ts();
    return {
      operatorCode: this.operatorCode,
      requestTime,
      sign:         this.sign(requestTime, action),
    };
  }

  // ── HTTP helpers ──────────────────────────────────────────────────────────

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.callApi<T>({ method: 'GET', url: path, params });
  }

  async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    return this.callApi<T>({ method: 'POST', url: path, data: body });
  }

  // ── Game launch ───────────────────────────────────────────────────────────

  /**
   * Launch a game session (casino, sports, …) and return the iframe / redirect URL.
   * @param userId      Local user ID (game_db or sports_db)
   * @param productId   GSC product ID (e.g. 1009 = CQ9, 1005 = SBO)
   * @param gameCode    Individual game code (empty string → lobby)
   * @param opts        Extra launch options
   */
  async launchGame(opts: {
    userId:      string | number;
    productId:   number | string;
    gameCode?:   string;
    language?:   string;
    isMobile?:   boolean;
    lobbyUrl?:   string;
  }): Promise<{ sessionId: string; gameUrl: string; expiresAt: Date }> {
    const action = 'launchGame';
    const res = await this.post<{ status: number; data?: { url: string } }>('/api/v2/game/launch', {
      ...this._base(action),
      userId:    String(opts.userId),
      productId: opts.productId,
      gameCode:  opts.gameCode   ?? '',
      language:  opts.language   ?? 'vi',
      isMobile:  opts.isMobile   ?? false,
      lobbyUrl:  opts.lobbyUrl   ?? '',
    });

    if (res.status !== 0 || !res.data?.url) {
      throw new Error(`GSC launchGame failed: status=${res.status}`);
    }

    return {
      sessionId: `gsc_${Date.now()}`,
      gameUrl:   res.data.url,
      expiresAt: new Date(Date.now() + 3_600_000),
    };
  }

  // ── Seamless wallet callbacks ─────────────────────────────────────────────

  /** Verify incoming seamless request signature from GSC. */
  verifySeamlessSign(
    operatorCode: string,
    requestTime:  number,
    action:       string,
    incoming:     string,
  ): boolean {
    const expected = crypto
      .createHmac('sha256', this.secretKey)
      .update(`${operatorCode}${requestTime}${action}`)
      .digest('hex');
    return expected === incoming;
  }

  async handleBalance(
    body: { userId: string; operatorCode: string },
    prisma: { user: { findUnique: Function } },
  ): Promise<{ status: number; balance?: number; message?: string }> {
    const user = await prisma.user.findUnique({
      where:  { id: body.userId },
      select: { balance: true },
    });
    if (!user) return { status: 1, message: 'User not found' };
    return { status: 0, balance: Number(user.balance) };
  }

  async handleTransaction(
    body: {
      userId:        string;
      transactionId: string;
      roundId?:      string;
      txType:        'bet' | 'win' | 'refund' | 'cancel';
      amount:        number | string;
      productId?:    number | string;
      gameCode?:     string;
    },
    prisma: { user: { findUnique: Function; update: Function }; transaction: { findFirst: Function; create: Function }; $transaction: Function },
  ): Promise<{ status: number; balance?: number; message?: string }> {
    const { userId, transactionId, txType, amount, roundId, productId, gameCode } = body;
    const amt   = Math.abs(Number(amount));
    const isBet = ['bet', 'debit'].includes(txType?.toLowerCase());

    // Idempotency
    const existing = await prisma.transaction.findFirst({
      where: { referenceId: String(transactionId), referenceType: 'gsc_tx' },
    });
    if (existing) {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true } });
      return { status: 0, balance: Number(u?.balance ?? 0), message: 'already processed' };
    }

    const result = await prisma.$transaction(async (tx: typeof prisma) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { balance: true } });
      if (!user) throw new Error('User not found');
      if (isBet && Number(user.balance) < amt) throw new Error('Insufficient balance');

      const updated = await tx.user.update({
        where:  { id: userId },
        data:   { balance: isBet ? { decrement: amt } : { increment: amt } },
        select: { balance: true },
      });

      await tx.transaction.create({
        data: {
          userId,
          type:          isBet ? 'bet' : txType,
          amount:        isBet ? -amt : amt,
          balanceAfter:  Number(updated.balance),
          referenceId:   String(transactionId),
          referenceType: 'gsc_tx',
          note:          `GSC ${txType} product=${productId} game=${gameCode} round=${roundId}`,
        },
      });

      return { balance: Number(updated.balance) };
    });

    return { status: 0, balance: result.balance };
  }
}
