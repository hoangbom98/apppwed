'use strict';
/**
 * ContentModerator — kiểm duyệt nội dung theo từ khóa + AI (tùy chọn).
 * Không phụ thuộc @xenova/transformers (heavy dep); dùng keyword-first approach
 * và tích hợp với aiService nếu ENABLE_AI=true.
 */
const logger = require('../shared/services/logger');

// Danh sách từ khóa nhạy cảm (mở rộng dễ dàng qua SystemConfig)
const SENSITIVE_KEYWORDS = [
  // Gian lận / lừa đảo
  'lừa đảo', 'scam', 'fraud', 'cheat', 'hack', 'phishing',
  // Đánh bạc (bất hợp pháp)
  'đánh bạc', 'cờ bạc', 'casino lậu', 'cá độ bất hợp pháp',
  // Nội dung bạo lực / khiêu dâm
  'khiêu dâm', 'pornography', 'violence threat', 'murder',
  // Spam
  'click here to win', 'free money', 'earn 1000usd daily',
  // Tin nhắn rác
  'spam', 'unsolicited',
];

// Regex patterns
const PATTERNS = [
  /\b(v[i!1][a@4]gr[a@4]|c[i!1][a@4]l[i!1][s5])\b/i,          // pharma spam
  /\b\d{10,16}\b.*\b(bank|card|account)\b/i,                    // card numbers
  /https?:\/\/[^\s]+\.(ru|cn|tk|ml)\b/i,                        // high-risk TLDs
];

class ContentModerator {
  /**
   * Kiểm tra một đoạn text.
   * @returns {{ flagged: boolean, reason: string|null, confidence: number }}
   */
  async check(text) {
    if (!text || typeof text !== 'string') return { flagged: false, reason: null, confidence: 0 };

    const lower = text.toLowerCase();

    // ── 1. Keyword scan ───────────────────────────────────────────
    for (const kw of SENSITIVE_KEYWORDS) {
      if (lower.includes(kw)) {
        return { flagged: true, reason: 'sensitive_keyword', keyword: kw, confidence: 0.9 };
      }
    }

    // ── 2. Regex scan ─────────────────────────────────────────────
    for (const pattern of PATTERNS) {
      if (pattern.test(text)) {
        return { flagged: true, reason: 'pattern_match', pattern: pattern.source, confidence: 0.85 };
      }
    }

    // ── 3. AI-assisted (optional) ────────────────────────────────
    if (process.env.ENABLE_AI === 'true') {
      try {
        const aiService = require('../shared/services/aiService');
        if (typeof aiService.moderateContent === 'function') {
          const aiResult = await aiService.moderateContent(text);
          if (aiResult?.flagged) {
            return { flagged: true, reason: 'ai_moderation', confidence: aiResult.score || 0.7 };
          }
        }
      } catch { /* AI unavailable — continue */ }
    }

    return { flagged: false, reason: null, confidence: 0 };
  }

  /**
   * Xử lý nội dung vi phạm — ẩn content + tạo báo cáo.
   */
  async handleViolation(prisma, userId, content, reason) {
    try {
      const adminPrisma = this._adminPrisma();

      // Tạo risk alert
      const rule = await this._getOrCreateRule(adminPrisma, 'content_violation', 'Automated content moderation');
      await adminPrisma.riskAlert.create({
        data: {
          userId,
          ruleId:  rule.id,
          details: { content: content.substring(0, 500), reason },
          status:  'new',
        },
      });

      logger.warn('[ContentModerator] violation flagged', { userId, reason });
    } catch (err) {
      logger.error('[ContentModerator] handleViolation error', { err: err.message });
    }
  }

  async _getOrCreateRule(prisma, name, description) {
    let rule = await prisma.riskRule.findFirst({ where: { name } });
    if (!rule) {
      rule = await prisma.riskRule.create({
        data: { name, description, action: 'flag_content', status: 'active' },
      });
    }
    return rule;
  }

  _adminPrisma() {
    const { getPrismaClient } = require('../../config/databases');
    return getPrismaClient('admin');
  }
}

module.exports = ContentModerator;
