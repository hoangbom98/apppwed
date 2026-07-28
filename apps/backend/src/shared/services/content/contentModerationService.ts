// @ts-nocheck
'use strict';
/**
 * ContentModerationService — kiểm duyệt nội dung tự động.
 *
 * Tích hợp 2 lớp:
 *   1. Perspective API (Google) — AI detect toxicity, spam, threat
 *      Free: https://perspectiveapi.com — cần key từ console.cloud.google.com
 *   2. Local keyword filter — fallback khi Perspective không available
 *
 * Dùng cho: chat Dating, tin nhắn Game, bình luận Sports.
 *
 * Sử dụng:
 *   const mod = require('./contentModerationService');
 *   const result = await mod.moderate('nội dung cần kiểm tra');
 *   if (!result.safe) return error(res, 'Nội dung không phù hợp');
 */
const https  = require('https');
const logger = require('./logger');

const PERSPECTIVE_KEY = process.env.PERSPECTIVE_API_KEY || '';
const PERSPECTIVE_URL = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';

// Ngưỡng để block content (0-1, mặc định 0.8)
const TOXICITY_THRESHOLD = parseFloat(process.env.PERSPECTIVE_THRESHOLD || '0.8');

// ── Keyword filter (luôn chạy, không phụ thuộc API) ──────────────────────────
const BANNED_PATTERNS = [
  /lừa\s*đảo/i, /hack(ing)?/i, /exploit/i,
  /cheat/i, /sex|porn|nude/i, /drug(s)?/i,
  /scam/i, /cá\s*độ\s*bất\s*hợp\s*pháp/i,
];

function localFilter(text) {
  if (!text) return { safe: true, score: 0 };
  const found = BANNED_PATTERNS.filter(p => p.test(text));
  if (found.length) {
    return { safe: false, score: 0.95, method: 'keyword', reasons: found.map(p => p.source) };
  }
  return { safe: true, score: 0, method: 'keyword' };
}

// ── Perspective API ───────────────────────────────────────────────────────────
function perspectivePost(text) {
  return new Promise((resolve, reject) => {
    if (!PERSPECTIVE_KEY) return resolve(null);
    const body = JSON.stringify({
      comment:           { text },
      languages:         ['vi', 'en'],
      requestedAttributes: {
        TOXICITY:       {},
        SPAM:           {},
        THREAT:         {},
        SEXUALLY_EXPLICIT: {},
      },
    });
    const url   = `${PERSPECTIVE_URL}?key=${PERSPECTIVE_KEY}`;
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 5000,
    };
    const req = https.request(opts, (res) => {
      let raw = '';
      res.on('data', (c) => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch { resolve(null); }
      });
    });
    req.on('error', (e) => { logger.warn(`[Moderation] Perspective error: ${e.message}`); resolve(null); });
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(body);
    req.end();
  });
}

// ── Public API ────────────────────────────────────────────────────────────────
/**
 * Kiểm duyệt nội dung văn bản.
 * @param {string} text
 * @returns {{ safe: boolean, score: number, method: string, flags?: object }}
 */
async function moderate(text) {
  if (!text || text.trim().length === 0) return { safe: true, score: 0 };

  // Lớp 1: local keyword filter (always runs, instant)
  const local = localFilter(text);
  if (!local.safe) return local;

  // Lớp 2: Perspective API (if configured)
  try {
    const data = await perspectivePost(text);
    if (!data?.attributeScores) {
      // API unavailable — trust local filter result
      return { safe: true, score: 0, method: 'local_only' };
    }

    const scores = {};
    let maxScore = 0;

    for (const [attr, val] of Object.entries(data.attributeScores)) {
      const s = val?.summaryScore?.value || 0;
      scores[attr.toLowerCase()] = parseFloat(s.toFixed(3));
      if (s > maxScore) maxScore = s;
    }

    const blocked = maxScore >= TOXICITY_THRESHOLD;
    return {
      safe:   !blocked,
      score:  parseFloat(maxScore.toFixed(3)),
      method: 'perspective',
      flags:  scores,
    };
  } catch (err) {
    logger.warn(`[Moderation] Perspective unavailable: ${err.message}`);
    return { safe: true, score: 0, method: 'local_fallback' };
  }
}

module.exports = { moderate, localFilter };
