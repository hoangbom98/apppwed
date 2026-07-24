'use strict';
/**
 * game/controllers/gscSeamlessController.js
 *
 * Handles all INBOUND Seamless Wallet callbacks from GSC+ to our server.
 * GSC calls these endpoints; we respond with the player's wallet state.
 *
 * Routes (registered in game/routes/index.js):
 *   POST /api/game/v1/api/seamless/balance      — 2.1 Balance inquiry
 *   POST /api/game/v1/api/seamless/withdraw     — 2.2 Withdraw (debit / bet)
 *   POST /api/game/v1/api/seamless/deposit      — 2.3 Deposit (credit / win)
 *   POST /api/game/v1/api/seamless/pushbetdata  — 2.4 Push Bet Data (sync only)
 *
 * Seamless wallet codes (returned in every response):
 *   0    = success
 *   999  = internal server error
 *   1000 = member not found
 *   1001 = insufficient balance
 *   1002 = proxy key error (bad operator_code)
 *   1003 = duplicate transaction
 *   1004 = invalid signature
 *   1005 = no game list
 *   1006 = bet not found
 *   2000 = product under maintenance
 *
 * Signature verification per GSC spec:
 *   balance:     MD5( operator_code + request_time + "getbalance" + secret_key )
 *   withdraw:    MD5( operator_code + request_time + "withdraw"   + secret_key )
 *   deposit:     MD5( operator_code + request_time + "deposit"    + secret_key )
 *   pushbetdata: MD5( operator_code + request_time + "pushbetdata"+ secret_key )
 */

const crypto = require('crypto');
const logger  = require('../../../shared/services/logger');

// ── Response codes ─────────────────────────────────────────────────────────────
const CODE = {
  SUCCESS:         0,
  INTERNAL_ERROR:  999,
  MEMBER_NOT_FOUND: 1000,
  INSUFFICIENT:    1001,
  PROXY_KEY_ERROR: 1002,
  DUPLICATE_TX:    1003,
  INVALID_SIGN:    1004,
  BET_NOT_FOUND:   1006,
  MAINTENANCE:     2000,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Verify inbound seamless signature. */
function verifySign(operatorCode, requestTime, action, incomingSign) {
  const secretKey = process.env.GSC_SECRET_KEY || '';
  const expected  = crypto
    .createHash('md5')
    .update(`${operatorCode}${requestTime}${action}${secretKey}`)
    .digest('hex');
  return expected === (incomingSign || '').toLowerCase();
}

/** Validate that the operator_code matches our configured code. */
function validOperator(operatorCode) {
  const cfg = process.env.GSC_API_KEY || '';   // operator_code stored in GSC_API_KEY
  return !cfg || operatorCode === cfg;
}

/** Build an error response with the GSC data-array wrapper. */
function _errResponse(res, memberAccount, productCode, code, message) {
  return res.json({ data: [{ member_account: memberAccount, product_code: productCode, code, message }] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2.1  Balance
// POST /v1/api/seamless/balance
//
// Request:
//   { batch_requests: [{ member_account, product_code }], operator_code, currency, sign, request_time }
//
// Response:
//   { data: [{ member_account, product_code, balance, code, message }] }
// ═══════════════════════════════════════════════════════════════════════════════

exports.balance = async (req, res) => {
  try {
    const { batch_requests, operator_code, sign, request_time } = req.body;

    // Validate operator
    if (!validOperator(operator_code)) {
      return res.json({ data: [{ code: CODE.PROXY_KEY_ERROR, message: 'Invalid operator_code' }] });
    }

    // Verify signature
    if (!verifySign(operator_code, request_time, 'getbalance', sign)) {
      logger.warn(`[GSC/Balance] Invalid sign from operator=${operator_code}`);
      return res.json({ data: [{ code: CODE.INVALID_SIGN, message: 'Invalid signature' }] });
    }

    if (!Array.isArray(batch_requests) || batch_requests.length === 0) {
      return res.json({ data: [] });
    }

    const prisma = req.prisma;
    const results = await Promise.all(
      batch_requests.map(async ({ member_account, product_code }) => {
        try {
          const user = await prisma.user.findFirst({
            where:  { username: member_account },
            select: { balance: true },
          });
          if (!user) {
            return { member_account, product_code, balance: 0, code: CODE.MEMBER_NOT_FOUND, message: 'Member not found' };
          }
          return { member_account, product_code, balance: Number(user.balance), code: CODE.SUCCESS, message: '' };
        } catch (e) {
          logger.error(`[GSC/Balance] member=${member_account} error: ${e.message}`);
          return { member_account, product_code, balance: 0, code: CODE.INTERNAL_ERROR, message: 'Internal error' };
        }
      }),
    );

    return res.json({ data: results });
  } catch (err) {
    logger.error(`[GSC/Balance] ${err.message}`);
    return res.json({ data: [{ code: CODE.INTERNAL_ERROR, message: 'Internal server error' }] });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2.2  Withdraw  (BET deduction)
// POST /v1/api/seamless/withdraw
//
// Request:
//   { batch_requests: [{ member_account, product_code, game_type, transactions: [Transaction] }],
//     operator_code, currency, sign, request_time }
//
// Response:
//   { data: [{ member_account, product_code, before_balance, balance, code, message }] }
// ═══════════════════════════════════════════════════════════════════════════════

exports.withdraw = async (req, res) => {
  try {
    const { batch_requests, operator_code, sign, request_time } = req.body;

    if (!validOperator(operator_code)) {
      return res.json({ data: [{ code: CODE.PROXY_KEY_ERROR, message: 'Invalid operator_code' }] });
    }
    if (!verifySign(operator_code, request_time, 'withdraw', sign)) {
      logger.warn(`[GSC/Withdraw] Invalid sign from operator=${operator_code}`);
      return res.json({ data: [{ code: CODE.INVALID_SIGN, message: 'Invalid signature' }] });
    }
    if (!Array.isArray(batch_requests) || batch_requests.length === 0) {
      return res.json({ data: [] });
    }

    const prisma  = req.prisma;
    const results = await Promise.all(
      batch_requests.map(async ({ member_account, product_code, transactions }) => {
        try {
          // Process each transaction sequentially within this member's batch
          let lastBefore = null;
          let lastAfter  = null;

          for (const tx of (transactions || [])) {
            const {
              id: txId,
              action,
              wager_code,
              wager_status,
              round_id,
              amount,
              bet_amount,
              valid_bet_amount,
              game_code,
              wager_type,
            } = tx;

            // Idempotency: if txId already exists, return duplicate
            const existing = await prisma.gameTransaction.findFirst({
              where: { externalId: String(txId) },
            });
            if (existing) {
              // Return current balance (duplicate transaction — per spec)
              const user = await prisma.user.findFirst({
                where:  { username: member_account },
                select: { balance: true },
              });
              const bal = user ? Number(user.balance) : 0;
              return { member_account, product_code, before_balance: bal, balance: bal, code: CODE.DUPLICATE_TX, message: 'Duplicate transaction' };
            }

            // Perform atomic debit
            const result = await prisma.$transaction(async (tx2) => {
              const user = await tx2.user.findFirst({
                where:  { username: member_account },
                select: { id: true, balance: true },
              });
              if (!user) throw Object.assign(new Error('Member not found'), { gscCode: CODE.MEMBER_NOT_FOUND });

              const before = Number(user.balance);
              const debit  = Math.abs(Number(amount || bet_amount || 0));

              if (before < debit) {
                throw Object.assign(new Error('Insufficient balance'), { gscCode: CODE.INSUFFICIENT });
              }

              const updated = await tx2.user.update({
                where: { id: user.id },
                data:  { balance: { decrement: debit } },
                select: { balance: true },
              });
              const after = Number(updated.balance);

              // Record transaction
              await tx2.gameTransaction.create({
                data: {
                  userId:           user.id,
                  externalId:       String(txId),
                  action,
                  wagerCode:        wager_code,
                  wagerStatus:      wager_status,
                  roundId:          String(round_id),
                  productCode:      String(product_code),
                  gameCode:         game_code || null,
                  gameType:         tx.game_type || null,
                  wagerType:        wager_type || 'NORMAL',
                  amount:           -debit,
                  betAmount:        Number(bet_amount || 0),
                  validBetAmount:   Number(valid_bet_amount || 0),
                  prizeAmount:      0,
                  balanceBefore:    before,
                  balanceAfter:     after,
                },
              });

              return { before, after };
            });

            lastBefore = result.before;
            lastAfter  = result.after;
          }

          return {
            member_account,
            product_code,
            before_balance: lastBefore,
            balance:        lastAfter,
            code:    CODE.SUCCESS,
            message: '',
          };
        } catch (e) {
          logger.error(`[GSC/Withdraw] member=${member_account} error: ${e.message}`);
          const gscCode = e.gscCode || CODE.INTERNAL_ERROR;
          const user = await prisma.user.findFirst({ where: { username: member_account }, select: { balance: true } }).catch(() => null);
          const bal  = user ? Number(user.balance) : 0;
          return { member_account, product_code, before_balance: bal, balance: bal, code: gscCode, message: e.message };
        }
      }),
    );

    return res.json({ data: results });
  } catch (err) {
    logger.error(`[GSC/Withdraw] ${err.message}`);
    return res.json({ data: [{ code: CODE.INTERNAL_ERROR, message: 'Internal server error' }] });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2.3  Deposit  (WIN credit / bonus / settlement)
// POST /v1/api/seamless/deposit
//
// Request:
//   { batch_requests: [{ member_account, product_code, game_type, transactions: [Transaction] }],
//     operator_code, currency, sign, request_time }
//
// Response:
//   { data: [{ member_account, product_code, before_balance, balance, code, message }] }
//
// NOTE: Must accept settled deposits even without prior bets (promotional bonuses).
//       WBET products do NOT use this endpoint — payouts handled manually.
// ═══════════════════════════════════════════════════════════════════════════════

exports.deposit = async (req, res) => {
  try {
    const { batch_requests, operator_code, sign, request_time } = req.body;

    if (!validOperator(operator_code)) {
      return res.json({ data: [{ code: CODE.PROXY_KEY_ERROR, message: 'Invalid operator_code' }] });
    }
    if (!verifySign(operator_code, request_time, 'deposit', sign)) {
      logger.warn(`[GSC/Deposit] Invalid sign from operator=${operator_code}`);
      return res.json({ data: [{ code: CODE.INVALID_SIGN, message: 'Invalid signature' }] });
    }
    if (!Array.isArray(batch_requests) || batch_requests.length === 0) {
      return res.json({ data: [] });
    }

    const prisma  = req.prisma;
    const results = await Promise.all(
      batch_requests.map(async ({ member_account, product_code, transactions }) => {
        try {
          let lastBefore = null;
          let lastAfter  = null;

          for (const tx of (transactions || [])) {
            const {
              id: txId,
              action,
              wager_code,
              wager_status,
              round_id,
              amount,
              bet_amount,
              valid_bet_amount,
              prize_amount,
              settled_at,
              game_code,
              wager_type,
            } = tx;

            // Idempotency check
            const existing = await prisma.gameTransaction.findFirst({
              where: { externalId: String(txId) },
            });
            if (existing) {
              const user = await prisma.user.findFirst({ where: { username: member_account }, select: { balance: true } });
              const bal  = user ? Number(user.balance) : 0;
              return { member_account, product_code, before_balance: bal, balance: bal, code: CODE.DUPLICATE_TX, message: 'Duplicate transaction' };
            }

            // Perform atomic credit
            const result = await prisma.$transaction(async (tx2) => {
              const user = await tx2.user.findFirst({
                where:  { username: member_account },
                select: { id: true, balance: true },
              });
              if (!user) throw Object.assign(new Error('Member not found'), { gscCode: CODE.MEMBER_NOT_FOUND });

              const before = Number(user.balance);
              const credit = Math.abs(Number(amount || prize_amount || 0));

              const updated = await tx2.user.update({
                where: { id: user.id },
                data:  { balance: { increment: credit } },
                select: { balance: true },
              });
              const after = Number(updated.balance);

              await tx2.gameTransaction.create({
                data: {
                  userId:           user.id,
                  externalId:       String(txId),
                  action,
                  wagerCode:        wager_code,
                  wagerStatus:      wager_status,
                  roundId:          String(round_id),
                  productCode:      String(product_code),
                  gameCode:         game_code || null,
                  gameType:         tx.game_type || null,
                  wagerType:        wager_type || 'NORMAL',
                  amount:           credit,
                  betAmount:        Number(bet_amount  || 0),
                  validBetAmount:   Number(valid_bet_amount || 0),
                  prizeAmount:      Number(prize_amount || 0),
                  settledAt:        settled_at ? new Date(settled_at) : null,
                  balanceBefore:    before,
                  balanceAfter:     after,
                },
              });

              return { before, after };
            });

            lastBefore = result.before;
            lastAfter  = result.after;
          }

          return {
            member_account,
            product_code,
            before_balance: lastBefore,
            balance:        lastAfter,
            code:    CODE.SUCCESS,
            message: '',
          };
        } catch (e) {
          logger.error(`[GSC/Deposit] member=${member_account} error: ${e.message}`);
          const gscCode = e.gscCode || CODE.INTERNAL_ERROR;
          const user = await prisma.user.findFirst({ where: { username: member_account }, select: { balance: true } }).catch(() => null);
          const bal  = user ? Number(user.balance) : 0;
          return { member_account, product_code, before_balance: bal, balance: bal, code: gscCode, message: e.message };
        }
      }),
    );

    return res.json({ data: results });
  } catch (err) {
    logger.error(`[GSC/Deposit] ${err.message}`);
    return res.json({ data: [{ code: CODE.INTERNAL_ERROR, message: 'Internal server error' }] });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2.4  Push Bet Data  (sync only — no balance changes)
// POST /v1/api/seamless/pushbetdata
//
// Request:
//   { operator_code, wagers: [Wager], sign, request_time }
//
// Response:
//   { code, message }
// ═══════════════════════════════════════════════════════════════════════════════

exports.pushbetdata = async (req, res) => {
  try {
    const { operator_code, wagers, sign, request_time } = req.body;

    if (!validOperator(operator_code)) {
      return res.json({ code: CODE.PROXY_KEY_ERROR, message: 'Invalid operator_code' });
    }
    if (!verifySign(operator_code, request_time, 'pushbetdata', sign)) {
      logger.warn(`[GSC/PushBet] Invalid sign from operator=${operator_code}`);
      return res.json({ code: CODE.INVALID_SIGN, message: 'Invalid signature' });
    }
    if (!Array.isArray(wagers) || wagers.length === 0) {
      return res.json({ code: CODE.SUCCESS, message: '' });
    }

    const prisma = req.prisma;

    // Upsert each wager status — no balance changes
    for (const w of wagers) {
      const {
        member_account,
        bet_amount,
        valid_bet_amount,
        prize_amount,
        tip_amount,
        wager_type,
        wager_code,
        wager_status,
        round_id,
        channel_code,
        game_type,
        settled_at,
        created_at,
        payload,
        product_code,
        game_code,
        currency,
      } = w;

      try {
        // Upsert by wager_code — create if new, update status if exists
        await prisma.gameWager.upsert({
          where:  { wagerCode: wager_code },
          update: {
            wagerStatus:    wager_status,
            prizeAmount:    Number(prize_amount  || 0),
            settledAt:      settled_at ? new Date(settled_at) : null,
            payload:        payload ? JSON.stringify(payload) : null,
          },
          create: {
            memberAccount:  member_account,
            wagerCode:      wager_code,
            wagerStatus:    wager_status,
            wagerType:      wager_type || 'NORMAL',
            roundId:        String(round_id),
            channelCode:    channel_code || 'gscp',
            gameType:       game_type,
            productCode:    String(product_code),
            gameCode:       game_code || null,
            currency:       currency  || 'VND',
            betAmount:      Number(bet_amount       || 0),
            validBetAmount: Number(valid_bet_amount || 0),
            prizeAmount:    Number(prize_amount     || 0),
            tipAmount:      Number(tip_amount       || 0),
            settledAt:      settled_at  ? new Date(settled_at)  : null,
            placedAt:       created_at  ? new Date(created_at)  : new Date(),
            payload:        payload ? JSON.stringify(payload) : null,
          },
        });
      } catch (e) {
        // Log and continue — don't fail the whole batch on one wager error
        logger.warn(`[GSC/PushBet] wager=${wager_code} member=${member_account} error: ${e.message}`);
      }
    }

    logger.debug(`[GSC/PushBet] synced ${wagers.length} wagers from operator=${operator_code}`);
    return res.json({ code: CODE.SUCCESS, message: '' });
  } catch (err) {
    logger.error(`[GSC/PushBet] ${err.message}`);
    return res.json({ code: CODE.INTERNAL_ERROR, message: 'Internal server error' });
  }
};
