// source/backend/src/shared/providers/tc-gaming/SeamlessTCGamingProvider.js
/**
 * Shared TC Gaming Seamless Wallet Provider
 *
 * Handles sgb (get balance), db (debit/bet), cr (credit/win) callbacks.
 * The `prisma` instance is passed at construction time by the calling module
 * (game module → game_db, sports module → sports_db).
 */
const BaseTCGamingProvider = require('./BaseTCGamingProvider');
const logger               = require('../../services/logger');

class SeamlessTCGamingProvider extends BaseTCGamingProvider {
  constructor(config, prisma) {
    super(config);
    this.prisma = prisma;
  }

  /**
   * Entry point for all inbound callbacks from TC Gaming.
   * @param {object} body  Raw request body (params/sign already verified by caller)
   */
  async handleCallback(body) {
    // If body still encrypted, caller should decrypt first
    const data   = typeof body === 'string' ? JSON.parse(body) : body;
    const method = data.method;

    switch (method) {
      case 'sgb': return this.handleGetBalance(data);
      case 'db':  return this.handleDebit(data);
      case 'cr':  return this.handleCredit(data);
      default:    throw new Error(`TCGaming seamless: method "${method}" not supported`);
    }
  }

  // ── sgb — get balance ─────────────────────────────────────────────────────

  async handleGetBalance({ username }) {
    const user = await this.prisma.user.findFirst({
      where:  { OR: [{ username }, { id: username }] },
      select: { id: true, balance: true },
    });
    if (!user) return { status: 1000, error_desc: 'User not found' };
    return { status: 0, balance: Number(user.balance) };
  }

  // ── db — debit (bet) ──────────────────────────────────────────────────────

  async handleDebit({ username, transactions = [] }) {
    const user = await this.prisma.user.findFirst({
      where:  { OR: [{ username }, { id: username }] },
      select: { id: true, balance: true },
    });
    if (!user) return { status: 1000, error_desc: 'User not found' };

    const balanceInfo = [];

    for (const txn of transactions) {
      const txId  = String(txn.txn_id || txn.transaction_id || '');
      const amt   = Math.abs(Number(txn.amount));
      const round = String(txn.round_id || txn.game_id || '');

      // Idempotency
      const existing = await this.prisma.transaction.findFirst({
        where: { referenceId: txId, referenceType: 'tc_debit' },
      });
      if (existing) {
        balanceInfo.push({ txn_id: txId, balance: Number(user.balance) });
        continue;
      }

      if (Number(user.balance) < amt) {
        return { status: 3001, error_desc: 'Insufficient balance' };
      }

      const updated = await this.prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
          where:  { id: user.id },
          data:   { balance: { decrement: amt } },
          select: { balance: true },
        });
        await tx.transaction.create({
          data: {
            userId:        user.id,
            type:          'bet',
            amount:        -amt,
            balanceAfter:  Number(u.balance),
            referenceId:   txId,
            referenceType: 'tc_debit',
            note:          `TCGaming DB round=${round}`,
          },
        });
        return u;
      });

      user.balance = updated.balance;
      balanceInfo.push({ txn_id: txId, balance: Number(updated.balance) });
    }

    return { status: 0, balance_info: balanceInfo };
  }

  // ── cr — credit (win) ─────────────────────────────────────────────────────

  async handleCredit({ username, transactions = [] }) {
    const user = await this.prisma.user.findFirst({
      where:  { OR: [{ username }, { id: username }] },
      select: { id: true, balance: true },
    });
    if (!user) return { status: 1000, error_desc: 'User not found' };

    const balanceInfo = [];

    for (const txn of transactions) {
      const txId  = String(txn.txn_id || txn.transaction_id || '');
      const amt   = Math.abs(Number(txn.amount));
      const round = String(txn.round_id || txn.game_id || '');

      // Idempotency
      const existing = await this.prisma.transaction.findFirst({
        where: { referenceId: txId, referenceType: 'tc_credit' },
      });
      if (existing) {
        const u = await this.prisma.user.findUnique({ where: { id: user.id }, select: { balance: true } });
        balanceInfo.push({ txn_id: txId, balance: Number(u?.balance ?? 0) });
        continue;
      }

      const updated = await this.prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
          where:  { id: user.id },
          data:   { balance: { increment: amt } },
          select: { balance: true },
        });
        await tx.transaction.create({
          data: {
            userId:        user.id,
            type:          'win',
            amount:        amt,
            balanceAfter:  Number(u.balance),
            referenceId:   txId,
            referenceType: 'tc_credit',
            note:          `TCGaming CR round=${round}`,
          },
        });
        return u;
      });

      user.balance = updated.balance;
      balanceInfo.push({ txn_id: txId, balance: Number(updated.balance) });
      logger.info(`[TCGaming/CR] userId=${user.id} amt=${amt} txId=${txId}`);
    }

    return { status: 0, balance_info: balanceInfo };
  }
}

module.exports = SeamlessTCGamingProvider;
