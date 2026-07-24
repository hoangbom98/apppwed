// @ts-nocheck
'use strict';
/**
 * BotDetector — phát hiện hành vi tự động (bot, scraper).
 * Phân tích session data gửi lên từ frontend (X-Session-Meta header).
 *
 * Session meta schema expected:
 *   { clickCount, timeSpent (ms), mouseMovements, eventSequence: string[] }
 */
const logger = require('../shared/services/logger');

class BotDetector {
  /**
   * @param {object} session
   * @returns {{ isBot: boolean, reason: string|null, confidence: number }}
   */
  detect(session = {}) {
    try {
      const {
        clickCount      = 0,
        timeSpent       = 0,
        mouseMovements  = 0,
        eventSequence   = [],
      } = session;

      const timeSpentSec = timeSpent / 1000;

      // ── Rule 1: nhiều click, thời gian rất ngắn ──────────────────
      if (clickCount > 100 && timeSpentSec < 10) {
        return { isBot: true, reason: 'high_frequency_click', confidence: 0.95 };
      }

      // ── Rule 2: click mà không có mouse movement ─────────────────
      if (mouseMovements < 5 && clickCount > 20) {
        return { isBot: true, reason: 'no_mouse_movement', confidence: 0.85 };
      }

      // ── Rule 3: click xảy ra nhưng không có hover trước ──────────
      if (
        Array.isArray(eventSequence) &&
        eventSequence.includes('click') &&
        !eventSequence.includes('mouseover') &&
        !eventSequence.includes('mousemove') &&
        clickCount > 10
      ) {
        return { isBot: true, reason: 'missing_hover', confidence: 0.75 };
      }

      // ── Rule 4: tốc độ click bất thường (> 10 click/giây) ────────
      if (timeSpentSec > 0 && clickCount / timeSpentSec > 10) {
        return { isBot: true, reason: 'click_rate_exceeded', confidence: 0.9 };
      }

      return { isBot: false, reason: null, confidence: 0 };
    } catch (err) {
      logger.error('[BotDetector] detect error', { err: err.message });
      return { isBot: false, reason: null, confidence: 0 };
    }
  }

  /**
   * Xử lý sau khi phát hiện bot — tạo alert + log.
   */
  async handleBot(prisma, userId, ip, session) {
    try {
      const adminPrisma = this._adminPrisma();

      // Security log
      await adminPrisma.securityLog.create({
        data: {
          userId,
          ip,
          type:     'bot',
          action:   'captcha_required',
          details:  { session },
          severity: 'medium',
        },
      });

      // Risk alert
      const rule = await this._getOrCreateRule(adminPrisma, 'bot_detected', 'Automated bot activity detected');
      await adminPrisma.riskAlert.create({
        data: {
          userId,
          ruleId:  rule.id,
          details: session,
          status:  'new',
        },
      });
    } catch (err) {
      logger.error('[BotDetector] handleBot error', { err: err.message });
    }
  }

  async _getOrCreateRule(prisma, name, description) {
    let rule = await prisma.riskRule.findFirst({ where: { name } });
    if (!rule) {
      rule = await prisma.riskRule.create({
        data: { name, description, action: 'require_captcha', status: 'active' },
      });
    }
    return rule;
  }

  _adminPrisma() {
    const { getPrismaClient } = require('../../config/databases');
    return getPrismaClient('admin');
  }
}

module.exports = BotDetector;
