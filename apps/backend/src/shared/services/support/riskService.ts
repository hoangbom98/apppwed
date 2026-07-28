// @ts-nocheck
/**
 * Risk Service — transaction risk scoring, velocity checks, fraud flagging,
 * and full integration with the autonomous Risk Detection & Response Engine.
 *
 * This service is the single entry-point that route handlers / payment flows
 * should call. It delegates to specialised detectors in src/risk/.
 */
const aiService  = require('./aiService');
const logger     = require('./logger');
const alertHelper = require('../../risk/alertHelper');

const RISK_HIGH_SCORE   = 70;
const RISK_MEDIUM_SCORE = 40;
const RISK_WINDOW_HOURS = 24;

// ── Lazy-loaded detector singletons ─────────────────────────────────────────
let _txMonitor, _bruteForce, _deviceFp, _fraudDetector,
    _botDetector, _secMonitor, _ddos, _geoMonitor,
    _contentMod, _compliance, _scorer;

function _getPrisma() {
  const { getPrismaClient } = require('../../config/databases');
  return getPrismaClient('admin');
}

function txMonitor(prisma)    { return (_txMonitor   || (_txMonitor   = new (require('../../risk/transactionMonitor'))(prisma))); }
function bruteForce()         { return (_bruteForce  || (_bruteForce  = new (require('../../risk/bruteForceDetector'))(_getPrisma()))); }
function deviceFp(prisma)     { return (_deviceFp    || (_deviceFp    = new (require('../../risk/deviceFingerprint'))(prisma))); }
function fraudDet(prisma)     { return (_fraudDetector || (_fraudDetector = new (require('../../risk/fraudDetector'))(prisma))); }
function botDet()             { return (_botDetector || (_botDetector = new (require('../../risk/botDetector'))())); }
function secMon()             { return (_secMonitor  || (_secMonitor  = new (require('../../risk/securityMonitor'))())); }
function ddosDet()            { return (_ddos        || (_ddos        = new (require('../../risk/ddosDetector'))())); }
function geoMon()             { return (_geoMonitor  || (_geoMonitor  = new (require('../../risk/geolocationMonitor'))(_getPrisma()))); }
function contentMod()         { return (_contentMod  || (_contentMod  = new (require('../../risk/contentModerator'))())); }
function compliance()         { return (_compliance  || (_compliance  = new (require('../../risk/complianceMonitor'))(_getPrisma()))); }
function scorer()             { return (_scorer      || (_scorer      = new (require('../../risk/riskScorer'))(_getPrisma()))); }

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Evaluate risk for an incoming transaction (deposit or withdrawal).
 * Runs rule-based + statistical checks; blends AI score when enabled.
 *
 * @param {object} prisma
 * @param {object} params
 * @param {string|number} params.userId
 * @param {number}        params.amount
 * @param {string}        params.type       – 'deposit' | 'withdraw' | 'bet'
 * @param {string}        [params.ip]
 * @param {string}        [params.projectCode]
 * @returns {{ score: number, risk: 'low'|'medium'|'high', flags: string[] }}
 */
exports.evaluate = async (prisma, { userId, amount, type, ip, projectCode = '' }) => {
  const flags = [];
  let score   = 0;

  try {
    const since = new Date(Date.now() - RISK_WINDOW_HOURS * 3_600_000);

    // 1. Fetch user data
    const adminPrisma = _getPrisma();
    const user = await adminPrisma.user.findUnique({
      where:  { id: userId },
      select: { createdAt: true, kycLevel: true },
    }).catch(() => null);

    if (!user) return { score: 0, risk: 'low', flags: [] };

    const accountAgeHours = (Date.now() - new Date(user.createdAt)) / 3_600_000;

    // 2. Recent transaction velocity
    const recentTxCount = await adminPrisma.transaction.count({
      where: { userId, createdAt: { gte: since } },
    }).catch(() => 0);

    // 3. Daily total for this transaction type
    const dailyAgg = await adminPrisma.transaction.aggregate({
      where: { userId, type, createdAt: { gte: since } },
      _sum:  { amount: true },
    }).catch(() => ({ _sum: { amount: 0 } }));
    const dailyTotal = Math.abs(Number(dailyAgg._sum?.amount) || 0);

    // 4. Rule scoring
    if (accountAgeHours < 1)     { score += 25; flags.push('brand_new_account'); }
    else if (accountAgeHours < 24) { score += 10; flags.push('new_account'); }

    if (recentTxCount > 20)      { score += 20; flags.push('high_velocity'); }
    else if (recentTxCount > 10) { score += 10; }

    if (amount > 50_000_000)     { score += 25; flags.push('large_single_amount'); }
    else if (amount > 10_000_000) { score += 10; }

    if (dailyTotal + amount > 100_000_000) { score += 20; flags.push('daily_limit_risk'); }

    const isKycVerified = ['level1', 'level2', 'verified'].includes(user.kycLevel);
    if (!isKycVerified && amount > 20_000_000) {
      score += 15; flags.push('unverified_kyc_large');
    }

    // 5. Transaction-monitor anomaly check
    const txAnomalyResult = await txMonitor(adminPrisma).evaluate(userId, amount, type);
    if (txAnomalyResult.risk === 'high') {
      score += 20; flags.push(txAnomalyResult.reason || 'tx_anomaly');
    } else if (txAnomalyResult.risk === 'medium') {
      score += 10; flags.push(txAnomalyResult.reason || 'tx_anomaly_medium');
    }

    // 6. Geo-location check
    if (ip) {
      const geoResult = await geoMon().checkLocation(ip, userId);
      if (geoResult.risk === 'critical') {
        score += 40; flags.push('geo_critical');
      } else if (geoResult.risk === 'high') {
        score += 20; flags.push('geo_high');
      }
    }

    // Cap at 100
    score = Math.min(100, score);

    // 7. If medium+ risk, also ask AI for a secondary score
    if (score >= RISK_MEDIUM_SCORE && process.env.ENABLE_AI === 'true') {
      try {
        const aiResult = await aiService.fraudScore({
          userId, amount, ip, recentTxCount,
          hoursActive: accountAgeHours,
          project: projectCode,
        });
        // Blend AI score (weighted 30%)
        score = Math.min(100, Math.round(score * 0.7 + aiResult.score * 0.3));
      } catch { /* AI unavailable */ }
    }

    const finalRisk = score >= RISK_HIGH_SCORE ? 'high' : score >= RISK_MEDIUM_SCORE ? 'medium' : 'low';
    logger.info(`[Risk] evaluate userId=${userId} amount=${amount} type=${type} score=${score} risk=${finalRisk}`);

    // 8. Send alert for high risk
    if (finalRisk === 'high') {
      alertHelper.sendAlert(
        `⚠️ High-risk transaction: user \`${userId}\`, amount ${amount}, type ${type}, flags: ${flags.join(', ')}`,
        'high', { score, flags, ip, projectCode }
      );
    }

    return { score, risk: finalRisk, flags };

  } catch (err) {
    logger.error(`[Risk] evaluate error: ${err.message}`);
    return { score: 0, risk: 'low', flags: [] };
  }
};

/**
 * Save a risk flag to the DB as an AML alert.
 */
exports.flagTransaction = async (prisma, userId, type, score, flags, amount, transactionId = null) => {
  try {
    const adminPrisma = _getPrisma();
    await adminPrisma.amlAlert.create({
      data: {
        userId,
        transactionId,
        ruleTriggered: flags.join(',') || type,
        details:       { type, score, flags, amount },
        status:        'new',
      },
    });
  } catch (err) {
    logger.warn(`[Risk] flagTransaction: ${err.message}`);
  }
};

/**
 * Check content moderation (chat messages, user bios, etc.).
 */
exports.moderateContent = async (text) => {
  try {
    const result = await contentMod().check(text);
    if (!result.flagged) return result;

    // Also try AI
    if (process.env.ENABLE_AI === 'true') {
      const aiResult = await aiService.moderateContent(text).catch(() => null);
      if (aiResult?.flagged) return { ...result, aiConfirmed: true };
    }
    return result;
  } catch (err) {
    logger.error('[Risk] moderateContent error', { err: err.message });
    return { flagged: false };
  }
};

/**
 * Check login attempt for brute-force.
 */
exports.checkLoginAttempt = (ip, email) => bruteForce().checkLoginAttempt(ip, email);
exports.recordLoginFailure = (ip, email) => bruteForce().recordFailure(ip, email);
exports.recordLoginSuccess = (ip, email) => bruteForce().recordSuccess(ip, email);

/**
 * Check device fingerprint on login.
 */
exports.checkDevice = (prisma, userId, fingerprint, ip, ua) =>
  deviceFp(prisma).checkDevice(userId, fingerprint, ip, ua);

/**
 * Check for multi-account / fraud signals on registration.
 */
exports.checkMultiAccount = (prisma, userId, fingerprint, ip) =>
  fraudDet(prisma).checkMultiAccount(userId, fingerprint, ip);

/**
 * Check DDoS.
 */
exports.checkDdos = (ip) => ddosDet().check(ip);

/**
 * Scan request body/query for injection attacks.
 */
exports.scanInput = (obj) => secMon().scanRequest(obj);
exports.handleAttack = (userId, ip, details) => secMon().handleAttack(userId, ip, details);

/**
 * Geolocation check.
 */
exports.checkLocation = (ip, userId) => geoMon().checkLocation(ip, userId);

/**
 * Bot detection from session metadata.
 */
exports.detectBot = (session) => botDet().detect(session);
exports.handleBot = (prisma, userId, ip, session) => botDet().handleBot(prisma, userId, ip, session);

/**
 * KYC / AML compliance checks.
 */
exports.checkKyc = (userId, amount) => compliance().checkKyc(userId, amount);
exports.checkAml = (userId, txId, amount, type) => compliance().checkAml(userId, txId, amount, type);

/**
 * Full composite risk score recalculation.
 */
exports.recalculateScore = (userId) => scorer().calculate(userId);

/**
 * Legacy: simple get-all for admin panel.
 */
exports.getAll  = async (prisma) => prisma.riskScore?.findMany?.() ?? [];
exports.getById = async (prisma, id) => prisma.riskScore?.findUnique?.({ where: { id } }) ?? null;

/**
 * Direct alert send (used by other services).
 */
exports.sendAlert = alertHelper.sendAlert;
