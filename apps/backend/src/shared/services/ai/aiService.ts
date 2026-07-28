// @ts-nocheck
'use strict';
/**
 * AI Service — integrates Deepseek, Groq (Llama 3), Google Translate, and
 * in-house fraud detection heuristics.
 *
 * Provider priority:
 *   chat/fraud  → Groq (fastest, free 30 req/min) → DeepSeek → OpenAI
 *   translate   → Google Translate → DeepSeek → LibreTranslate (fallback)
 *
 * All external calls are wrapped with graceful fallbacks so the main
 * application never crashes due to AI unavailability.
 */
const https  = require('https');
const crypto = require('crypto');
const logger = require('../logger');
const cache  = require('../cacheService');

// ── Config ────────────────────────────────────────────────────────────────
const DEEPSEEK_KEY     = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_URL     = 'https://api.deepseek.com/v1/chat/completions';
const GOOGLE_TRANS_KEY = process.env.GOOGLE_TRANSLATE_KEY || '';
const OPENAI_KEY       = process.env.OPENAI_API_KEY || '';
const OPENAI_URL       = 'https://api.openai.com/v1/chat/completions';
// ── Groq (free: 30 req/min, ~6000 tok/min on llama-3.3-70b) ──────────────
const GROQ_KEY         = process.env.GROQ_API_KEY || '';
const GROQ_URL         = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL       = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// ── HTTP helper ───────────────────────────────────────────────────────────
function postJson(url, headers, body) {
  return new Promise((resolve, reject) => {
    const data   = JSON.stringify(body);
    const parsed = new URL(url);
    const opts   = {
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers },
    };
    const req = https.request(opts, (res) => {
      let raw = '';
      res.on('data', (c) => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch { resolve({ error: 'parse_error', raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ── Translation ───────────────────────────────────────────────────────────
/**
 * Translate text using Google Translate API (or Deepseek as fallback).
 * @param {string} text
 * @param {string} target – ISO 639-1 language code, e.g. 'vi', 'en'
 * @param {string} [source] – auto-detect if omitted
 * @returns {Promise<string>} translated text
 */
async function translate(text, target = 'vi', source = null) {
  if (!text || !text.trim()) return text;

  const hash     = crypto.createHash('md5').update(`${target}:${text}`).digest('hex');
  const cacheKey = `ai:translate:${hash}`;

  return cache.remember(cacheKey, 86400, async () => {
    if (GOOGLE_TRANS_KEY) {
      try {
        const url    = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANS_KEY}`;
        const result = await postJson(url, {}, { q: text, target, ...(source ? { source } : {}) });
        const t      = result?.data?.translations?.[0]?.translatedText;
        if (t) return t;
      } catch (err) {
        logger.warn('Google Translate failed, falling back to Deepseek', { err: err.message });
      }
    }

    // Deepseek fallback
    if (DEEPSEEK_KEY) {
      try {
        const res = await postJson(DEEPSEEK_URL,
          { Authorization: `Bearer ${DEEPSEEK_KEY}` },
          {
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'You are a translation engine. Respond with ONLY the translated text, nothing else.' },
              { role: 'user',   content: `Translate to ${target}: ${text}` },
            ],
            max_tokens: 512,
          }
        );
        return res?.choices?.[0]?.message?.content?.trim() || text;
      } catch (err) {
        logger.warn('Deepseek translate failed', { err: err.message });
      }
    }

    return text; // graceful fallback — return original
  });
}

// ── Chat / Support Bot ────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Bạn là trợ lý CSKH của một nền tảng hẹn hò và giải trí Việt Nam.
Trả lời ngắn gọn, thân thiện, bằng tiếng Việt. Không cung cấp thông tin cá nhân của người dùng khác.
Nếu không biết câu trả lời, hãy hướng người dùng liên hệ hỗ trợ qua hotline.`;

/**
 * @param {Array<{role:string, content:string}>} messages – conversation history
 * @returns {Promise<string>}
 */
async function chat(messages) {
  const hash     = crypto.createHash('md5').update(JSON.stringify(messages)).digest('hex');
  const cacheKey = `ai:chat:${hash}`;

  return cache.remember(cacheKey, 3600, async () => {
    // Priority: Groq (free, fastest) → DeepSeek → OpenAI
    const providers = [];
    if (GROQ_KEY)      providers.push({ url: GROQ_URL,     key: GROQ_KEY,     model: GROQ_MODEL });
    if (DEEPSEEK_KEY)  providers.push({ url: DEEPSEEK_URL, key: DEEPSEEK_KEY, model: 'deepseek-chat' });
    if (OPENAI_KEY)    providers.push({ url: OPENAI_URL,   key: OPENAI_KEY,   model: 'gpt-4o-mini' });

    if (!providers.length) return 'Hệ thống AI tạm thời không khả dụng. Vui lòng liên hệ hỗ trợ.';

    for (const p of providers) {
      try {
        const res = await postJson(p.url,
          { Authorization: `Bearer ${p.key}` },
          {
            model: p.model,
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.slice(-10)],
            max_tokens: 400,
            temperature: 0.7,
          }
        );
        const reply = res?.choices?.[0]?.message?.content?.trim();
        if (reply) return reply;
      } catch (err) {
        logger.warn(`AI chat [${p.url}] failed, trying next: ${err.message}`);
      }
    }
    return 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại sau.';
  });
}

// ── Fraud / Risk Detection ────────────────────────────────────────────────
/**
 * Compute a risk score (0–100) for a transaction.
 * Uses heuristics + optional AI call.
 */
async function fraudScore({ userId, amount, _ip, _deviceId, recentTxCount = 0, hoursActive = 24, project = '' }) {
  let score = 0;

  // Rule-based heuristics
  if (amount > 50_000_000)      score += 30; // large amount (>50M VND)
  else if (amount > 10_000_000) score += 15;

  if (recentTxCount > 20) score += 20; // high velocity
  else if (recentTxCount > 10) score += 10;

  if (hoursActive < 1)  score += 25; // brand new account
  else if (hoursActive < 24) score += 10;

  // Cap at 100
  score = Math.min(100, score);

  logger.info('fraudScore computed', { userId, amount, score, project });
  return { score, risk: score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low' };
}

/**
 * Content moderation — detect spam / inappropriate content
 */
async function moderateContent(text) {
  if (!text) return { safe: true, score: 0 };

  // Simple keyword filter (extend as needed)
  const BANNED = ['scam', 'lừa đảo', 'hack', 'exploit', 'sex', 'porn', 'drug'];
  const lower  = text.toLowerCase();
  const found  = BANNED.filter(w => lower.includes(w));

  if (found.length > 0) return { safe: false, score: 90, reasons: found };
  return { safe: true, score: 0 };
}

module.exports = { translate, chat, fraudScore, moderateContent };
