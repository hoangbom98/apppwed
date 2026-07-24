// @ts-nocheck
/* eslint-disable */

/**
 * TranslationService — DeepSeek-powered text translation with DB caching.
 * Degrades gracefully: if DEEPSEEK_KEY is not set, returns original text unchanged.
 *
 * Public API:
 *   translate(prisma, text, targetLang, sourceLang='auto')
 *   detectLanguage(text)
 */
const axios = require('axios');

const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Translate text via DeepSeek API, with a 24 h DB cache in TranslationLog.
 * Returns original text when DEEPSEEK_KEY is absent (graceful degradation).
 *
 * @param {object} prisma - Prisma client
 * @param {string} text - Source text
 * @param {string} targetLang - e.g. 'en', 'vi', 'zh', 'ko'
 * @param {string} [sourceLang='auto'] - e.g. 'vi', 'auto'
 * @returns {Promise<string>} Translated text (or original on failure / no key)
 */
const translate = async (prisma, text, targetLang, sourceLang = 'auto') => {
  if (!DEEPSEEK_KEY) return text;

  // --- Cache lookup (last 24 h) ---
  try {
    const since = new Date(Date.now() - CACHE_TTL_MS);
    const cached = await prisma.translationLog.findFirst({
      where: {
        sourceText: text,
        sourceLang,
        targetLang,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (cached) return cached.translatedText;
  } catch (_) {
    // translationLog may not exist in all project schemas — skip
  }

  // --- Call DeepSeek API ---
  let translated = text;
  let tokenCount = 0;

  try {
    const response = await axios.post(
      DEEPSEEK_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a translator. Translate the following text to ${targetLang}. Return ONLY the translated text.`,
          },
          { role: 'user', content: text },
        ],
        max_tokens: 2048,
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    translated = response.data?.choices?.[0]?.message?.content?.trim() || text;
    tokenCount = response.data?.usage?.total_tokens || 0;
  } catch (err) {
    const logger = require('./logger');
    logger.error(`[TranslationService] DeepSeek error: ${err.message}`);
    return text; // degrade gracefully
  }

  // --- Persist to cache (non-blocking) ---
  try {
    await prisma.translationLog.create({
      data: { sourceLang, targetLang, sourceText: text, translatedText: translated, tokenCount },
    });
  } catch (_) {
    // ignore — caching is best-effort
  }

  return translated;
};

/**
 * Simple heuristic language detector.
 * Returns 'zh' for CJK, 'vi' for Vietnamese diacritics, 'en' otherwise.
 *
 * @param {string} text
 * @returns {'zh'|'vi'|'en'}
 */
const detectLanguage = (text) => {
  if (!text) return 'en';

  // CJK Unified Ideographs block (U+4E00–U+9FFF) + extensions
  if (/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(text)) return 'zh';

  // Vietnamese-specific diacritics (tonal marks + đ/Đ)
  if (/[àáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(text))
    return 'vi';

  return 'en';
};

module.exports = { translate, detectLanguage };
