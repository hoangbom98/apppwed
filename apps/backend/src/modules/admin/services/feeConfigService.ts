// @ts-nocheck
'use strict';
/**
 * FeeConfigService — Admin CRUD for FeeConfig rows.
 *
 * All mutations invalidate the GroupFinanceService fee cache so fees
 * take effect immediately without a server restart.
 *
 * USAGE
 * ─────
 *   const svc = new FeeConfigService(adminPrisma, groupFinanceService);
 *
 *   // List all fee configs
 *   const configs = await svc.list();
 *
 *   // Upsert a fee config
 *   await svc.upsert({ source: 'GAME', txType: 'WIN', feeType: 'PERCENTAGE', value: 2.5 });
 *
 *   // Deactivate a fee
 *   await svc.setActive(id, false);
 */

const logger = require('../../../shared/services/logger');

interface UpsertFeeConfigDto {
  source:      string;
  txType:      string;
  feeType:     string;   // 'PERCENTAGE' | 'FIXED'
  value:       number;
  minAmount?:  number | null;
  maxAmount?:  number | null;
  maxFee?:     number | null;
  isActive?:   boolean;
  startDate?:  string | null;
  endDate?:    string | null;
  description?: string | null;
}

class FeeConfigService {
  private prisma: any;
  private gf: any;  // GroupFinanceService — for cache invalidation

  constructor(adminPrisma: any, groupFinanceService: any) {
    this.prisma = adminPrisma;
    this.gf     = groupFinanceService;
  }

  /** List all FeeConfig rows, ordered by source then txType */
  async list() {
    const rows = await this.prisma.feeConfig.findMany({
      orderBy: [{ source: 'asc' }, { txType: 'asc' }],
    });
    return rows.map(this._format);
  }

  /** List only active configs for a specific source */
  async listBySource(source: string) {
    const rows = await this.prisma.feeConfig.findMany({
      where:   { source: source.toUpperCase(), isActive: true },
      orderBy: { txType: 'asc' },
    });
    return rows.map(this._format);
  }

  /** Get a single config by id */
  async getById(id: string) {
    const row = await this.prisma.feeConfig.findUnique({ where: { id } });
    if (!row) throw Object.assign(new Error('FeeConfig not found'), { status: 404, code: 'NOT_FOUND' });
    return this._format(row);
  }

  /**
   * Create or update a FeeConfig.
   * The unique key is (source, txType) — if a row already exists it is updated.
   */
  async upsert(dto: UpsertFeeConfigDto) {
    const source = dto.source.toUpperCase();
    const txType = dto.txType.toUpperCase();

    const row = await this.prisma.feeConfig.upsert({
      where:  { source_txType: { source, txType } },
      create: {
        source,
        txType,
        feeType:     dto.feeType.toUpperCase(),
        value:       dto.value,
        minAmount:   dto.minAmount  ?? null,
        maxAmount:   dto.maxAmount  ?? null,
        maxFee:      dto.maxFee     ?? null,
        isActive:    dto.isActive   ?? true,
        startDate:   dto.startDate  ? new Date(dto.startDate)  : null,
        endDate:     dto.endDate    ? new Date(dto.endDate)    : null,
        description: dto.description ?? null,
      },
      update: {
        feeType:     dto.feeType.toUpperCase(),
        value:       dto.value,
        minAmount:   dto.minAmount  ?? null,
        maxAmount:   dto.maxAmount  ?? null,
        maxFee:      dto.maxFee     ?? null,
        isActive:    dto.isActive   ?? true,
        startDate:   dto.startDate  ? new Date(dto.startDate)  : null,
        endDate:     dto.endDate    ? new Date(dto.endDate)    : null,
        description: dto.description ?? null,
      },
    });

    // Invalidate cache immediately
    await this.gf.invalidateFeeCache(source as any, txType as any);

    logger.info(`[FeeConfig] upsert source=${source} txType=${txType} feeType=${dto.feeType} value=${dto.value}`);
    return this._format(row);
  }

  /** Toggle isActive on a config row */
  async setActive(id: string, isActive: boolean) {
    const existing = await this.prisma.feeConfig.findUnique({ where: { id }, select: { source: true, txType: true } });
    if (!existing) throw Object.assign(new Error('FeeConfig not found'), { status: 404, code: 'NOT_FOUND' });

    const row = await this.prisma.feeConfig.update({
      where: { id },
      data:  { isActive },
    });

    await this.gf.invalidateFeeCache(existing.source as any, existing.txType as any);
    logger.info(`[FeeConfig] setActive id=${id} isActive=${isActive}`);
    return this._format(row);
  }

  /** Delete a fee config (use setActive(false) instead for soft-disable) */
  async delete(id: string) {
    const existing = await this.prisma.feeConfig.findUnique({ where: { id }, select: { source: true, txType: true } });
    if (!existing) throw Object.assign(new Error('FeeConfig not found'), { status: 404, code: 'NOT_FOUND' });

    await this.prisma.feeConfig.delete({ where: { id } });
    await this.gf.invalidateFeeCache(existing.source as any, existing.txType as any);
    logger.info(`[FeeConfig] delete id=${id}`);
  }

  /**
   * Seed the default recommended fee configs.
   * Idempotent — uses upsert so it is safe to run multiple times.
   */
  async seedDefaults() {
    const defaults: UpsertFeeConfigDto[] = [
      // Game: 2% fee on WIN payouts
      { source: 'GAME',   txType: 'WIN',     feeType: 'PERCENTAGE', value: 2.0,  description: 'Game win payout fee' },
      // Sports: 1.5% fee on WIN payouts
      { source: 'SPORTS', txType: 'WIN',     feeType: 'PERCENTAGE', value: 1.5,  description: 'Sports win payout fee' },
      // Trade: 0.5% fee on WIN (profit) payouts
      { source: 'TRADE',  txType: 'WIN',     feeType: 'PERCENTAGE', value: 0.5,  description: 'Trade profit fee' },
      // Dating: 1% fee on WIN
      { source: 'DATING', txType: 'WIN',     feeType: 'PERCENTAGE', value: 1.0,  description: 'Dating reward fee' },
      // All projects: fixed 5,000 VND withdraw fee
      { source: 'GAME',   txType: 'WITHDRAW', feeType: 'FIXED',     value: 5000, description: 'Game withdraw fee', maxFee: 50000 },
      { source: 'SPORTS', txType: 'WITHDRAW', feeType: 'FIXED',     value: 5000, description: 'Sports withdraw fee', maxFee: 50000 },
      { source: 'TRADE',  txType: 'WITHDRAW', feeType: 'FIXED',     value: 5000, description: 'Trade withdraw fee', maxFee: 50000 },
    ];

    for (const dto of defaults) {
      await this.upsert(dto);
    }

    logger.info(`[FeeConfig] seeded ${defaults.length} default fee configs`);
  }

  // ── Private ─────────────────────────────────────────────────────────────

  private _format(row: any) {
    return {
      id:          row.id,
      source:      row.source,
      txType:      row.txType,
      feeType:     row.feeType,
      value:       Number(row.value),
      minAmount:   row.minAmount  ? Number(row.minAmount)  : null,
      maxAmount:   row.maxAmount  ? Number(row.maxAmount)  : null,
      maxFee:      row.maxFee     ? Number(row.maxFee)     : null,
      isActive:    row.isActive,
      startDate:   row.startDate  ?? null,
      endDate:     row.endDate    ?? null,
      description: row.description ?? null,
      createdAt:   row.createdAt,
      updatedAt:   row.updatedAt,
    };
  }
}

module.exports = FeeConfigService;
export { FeeConfigService };
