// src/third-parties/providers/TCGaming/TCGamingProvider.ts
// ─────────────────────────────────────────────────────────────────────────────
// TC Gaming Aggregator — 200+ products.
// Scope: game + sports (e.g. product 151 = UG2 Sports).
//
// API protocol: DES-ECB encrypted JSON params + SHA-256 signature.
// Wallet models: TRANSFER (default) or SEAMLESS.
//
// TC Gaming product codes (partial):
//   16  = CQ9          (TRANSFER / SEAMLESS) [RNG, FISH]
//   47  = BTI Sports   (TRANSFER / SEAMLESS) [SPORT]
//   54  = SBO Sports   (TRANSFER)            [LIVE, SPORT]
//   98  = PG Soft      (TRANSFER / SEAMLESS) [RNG]
//  131  = PANDA SPORTS (TRANSFER / SEAMLESS) [SPORT]
//  140  = JILI         (TRANSFER)            [RNG, FISH, PVP]
//  151  = UG2 (United Gaming) (TRANSFER)    [SPORT]  ← primary for sports module
//  172  = Evolution    (TRANSFER)            [LIVE]
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto';
import { BaseProvider }  from '../../core/BaseProvider';
import { ServiceType, IAggregatorConfig } from '../../core/interfaces';
import { GameApiService }  from './services/GameApiService';
import { SportsApiService } from './services/SportsApiService';

export type WalletType = 'transfer' | 'seamless';

export class TCGamingProvider extends BaseProvider {
  readonly merchantCode: string;
  readonly desKey:       string;       // 8-byte ASCII
  readonly hashKey:      string;
  readonly currency:     string;

  constructor(cfg: IAggregatorConfig) {
    super('TCGAMING', cfg, ['game', 'sports', '*']);
    this.merchantCode = cfg.apiKey;
    this.desKey       = cfg.secretKey;
    this.hashKey      = (cfg.config as Record<string, string> | null)?.hashKey ?? '';
    this.currency     = (cfg.config as Record<string, string> | null)?.currency ?? 'VND2';
  }

  protected registerServices(): void {
    this.services.set(ServiceType.GAME_API,         new GameApiService(this));
    this.services.set(ServiceType.SPORTS_SOLUTIONS,  new SportsApiService(this));
  }

  // ── DES-ECB + SHA-256 crypto ──────────────────────────────────────────────

  /** Encrypt JSON params via DES-ECB → Base64 */
  encryptParams(params: Record<string, unknown>): string {
    const cipher = crypto.createCipheriv('des-ecb', Buffer.from(this.desKey, 'utf8'), null);
    cipher.setAutoPadding(true);
    let out = cipher.update(JSON.stringify(params), 'utf8', 'base64');
    out += cipher.final('base64');
    return out;
  }

  /** SHA-256(encryptedParams + hashKey) → hex */
  sign(encryptedParams: string): string {
    return crypto.createHash('sha256').update(encryptedParams + this.hashKey).digest('hex');
  }

  /** Decrypt DES-ECB Base64 → parsed JSON */
  decryptParams<T = Record<string, unknown>>(encrypted: string): T {
    const decipher = crypto.createDecipheriv('des-ecb', Buffer.from(this.desKey, 'utf8'), null);
    decipher.setAutoPadding(true);
    let out = decipher.update(encrypted, 'base64', 'utf8');
    out += decipher.final('utf8');
    return JSON.parse(out) as T;
  }

  /** Verify incoming callback signature. */
  verifySign(encryptedParams: string, sign: string): boolean {
    return this.sign(encryptedParams) === sign;
  }

  // ── HTTP call ─────────────────────────────────────────────────────────────

  /** POST to TC Gaming with encrypted params + signature (form-urlencoded). */
  async callTC<T = unknown>(params: Record<string, unknown>): Promise<T> {
    const encryptedParams = this.encryptParams(params);
    const sign            = this.sign(encryptedParams);

    const body = new URLSearchParams({
      merchant_code: this.merchantCode,
      params:        encryptedParams,
      sign,
    });

    return this.callApi<T>({
      method:  'POST',
      url:     this.config.baseUrl as string,
      data:    body.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  // ── Player management ─────────────────────────────────────────────────────

  async createPlayer(username: string, password: string): Promise<unknown> {
    return this.callTC({ method: 'cm', username, password, currency: this.currency });
  }

  async getBalance(username: string, productType: string | number): Promise<unknown> {
    return this.callTC({ method: 'gb', username, product_type: productType });
  }

  // ── Fund transfer (TRANSFER wallet model) ────────────────────────────────

  /**
   * Move funds between our main wallet and TC Gaming's product wallet.
   * @param fundType  '1' = deposit into TC Gaming, '2' = withdraw from TC Gaming
   */
  async fundTransfer(
    username:    string,
    productType: string | number,
    fundType:    '1' | '2',
    amount:      number,
    referenceNo: string,
  ): Promise<unknown> {
    return this.callTC({
      method:       'ft',
      username,
      product_type: productType,
      fund_type:    fundType,
      amount,
      reference_no: referenceNo,
    });
  }

  async transferOutAll(username: string, productType: string | number, referenceNo: string): Promise<unknown> {
    return this.callTC({ method: 'ftoa', username, product_type: productType, reference_no: referenceNo });
  }

  // ── Game launch ───────────────────────────────────────────────────────────

  /**
   * Launch a game / sports lobby.
   * @param productType  e.g. '151' (UG2 Sports), '131' (Casino), '16' (CQ9)
   * @param gameCode     Individual game code — empty string for product lobby
   */
  async launchGame(opts: {
    username:       string;
    productType:    string | number;
    gameCode?:      string;
    platform?:      'web' | 'h5';
    ip?:            string;
    language?:      string;
    lotteryBetMode?: string;
  }): Promise<string> {
    const params: Record<string, unknown> = {
      method:       'lg',
      username:     opts.username,
      product_type: opts.productType,
      game_mode:    '1',
      game_code:    opts.gameCode    ?? '',
      platform:     opts.platform    ?? 'h5',
      ip_address:   opts.ip          ?? '127.0.0.1',
      language:     opts.language    ?? 'vi',
    };
    if (opts.lotteryBetMode) params['lottery_bet_mode'] = opts.lotteryBetMode;

    const result = await this.callTC<{ game_url?: string; url?: string }>(params);
    return result.game_url ?? result.url ?? '';
  }

  // ── Seamless wallet callbacks ─────────────────────────────────────────────

  /**
   * Handle seamless callbacks (sgb / db / cr).
   * @param body    Decrypted callback body
   * @param prisma  Calling module's Prisma client (game_db or sports_db)
   */
  async handleSeamlessCallback(
    body: { method: string; username?: string; transactions?: unknown[] },
    prisma: { user: { findFirst: Function; update: Function }; transaction: { findFirst: Function; create: Function }; $transaction: Function },
  ): Promise<unknown> {
    switch (body.method) {
      case 'sgb': return this._seamlessBalance(body, prisma);
      case 'db':  return this._seamlessDebit(body as { method: string; username: string; transactions: unknown[] }, prisma);
      case 'cr':  return this._seamlessCredit(body as { method: string; username: string; transactions: unknown[] }, prisma);
      default:    throw new Error(`TCGaming seamless: unknown method "${body.method}"`);
    }
  }

  private async _seamlessBalance(
    { username }: { username?: string },
    prisma: { user: { findFirst: Function } },
  ): Promise<unknown> {
    const user = await prisma.user.findFirst({
      where:  { OR: [{ username }, { id: username }] },
      select: { id: true, balance: true },
    });
    if (!user) return { status: 1000, error_desc: 'User not found' };
    return { status: 0, balance: Number(user.balance) };
  }

  private async _seamlessDebit(
    { username, transactions }: { username: string; transactions: unknown[] },
    prisma: { user: { findFirst: Function; update: Function }; transaction: { findFirst: Function; create: Function }; $transaction: Function },
  ): Promise<unknown> {
    const user = await prisma.user.findFirst({
      where:  { OR: [{ username }, { id: username }] },
      select: { id: true, balance: true },
    });
    if (!user) return { status: 1000, error_desc: 'User not found' };

    const balanceInfo = [];
    for (const txn of transactions as Record<string, unknown>[]) {
      const txId  = String(txn['txn_id'] ?? txn['transaction_id'] ?? '');
      const amt   = Math.abs(Number(txn['amount']));
      const round = String(txn['round_id'] ?? txn['game_id'] ?? '');

      const existing = await prisma.transaction.findFirst({
        where: { referenceId: txId, referenceType: 'tc_debit' },
      });
      if (existing) { balanceInfo.push({ txn_id: txId, balance: Number(user.balance) }); continue; }

      if (Number(user.balance) < amt) return { status: 3001, error_desc: 'Insufficient balance' };

      const updated = await prisma.$transaction(async (tx: typeof prisma) => {
        const u = await tx.user.update({ where: { id: user.id }, data: { balance: { decrement: amt } }, select: { balance: true } });
        await tx.transaction.create({ data: { userId: user.id, type: 'bet', amount: -amt, balanceAfter: Number(u.balance), referenceId: txId, referenceType: 'tc_debit', note: `TCGaming DB round=${round}` } });
        return u;
      });
      user.balance = updated.balance;
      balanceInfo.push({ txn_id: txId, balance: Number(updated.balance) });
    }
    return { status: 0, balance_info: balanceInfo };
  }

  private async _seamlessCredit(
    { username, transactions }: { username: string; transactions: unknown[] },
    prisma: { user: { findFirst: Function; update: Function }; transaction: { findFirst: Function; create: Function }; $transaction: Function },
  ): Promise<unknown> {
    const user = await prisma.user.findFirst({
      where:  { OR: [{ username }, { id: username }] },
      select: { id: true, balance: true },
    });
    if (!user) return { status: 1000, error_desc: 'User not found' };

    const balanceInfo = [];
    for (const txn of transactions as Record<string, unknown>[]) {
      const txId  = String(txn['txn_id'] ?? txn['transaction_id'] ?? '');
      const amt   = Math.abs(Number(txn['amount']));
      const round = String(txn['round_id'] ?? txn['game_id'] ?? '');

      const existing = await prisma.transaction.findFirst({
        where: { referenceId: txId, referenceType: 'tc_credit' },
      });
      if (existing) {
        const u = await prisma.user.findFirst({ where: { id: user.id }, select: { balance: true } });
        balanceInfo.push({ txn_id: txId, balance: Number(u?.balance ?? 0) }); continue;
      }

      const updated = await prisma.$transaction(async (tx: typeof prisma) => {
        const u = await tx.user.update({ where: { id: user.id }, data: { balance: { increment: amt } }, select: { balance: true } });
        await tx.transaction.create({ data: { userId: user.id, type: 'win', amount: amt, balanceAfter: Number(u.balance), referenceId: txId, referenceType: 'tc_credit', note: `TCGaming CR round=${round}` } });
        return u;
      });
      user.balance = updated.balance;
      balanceInfo.push({ txn_id: txId, balance: Number(updated.balance) });
    }
    return { status: 0, balance_info: balanceInfo };
  }
}
