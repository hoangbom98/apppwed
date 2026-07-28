// @ts-nocheck
'use strict';
/**
 * EmailGuardService — phát hiện email tạm thời / throwaway qua Disify.
 *
 * Disify: https://www.disify.com — hoàn toàn miễn phí, không cần key.
 * Trả về { format: bool, disposable: bool, dns: bool, domain: string }
 *
 * Kết quả được cache 7 ngày (per-domain, không thay đổi thường xuyên).
 *
 * Sử dụng trong authController.register:
 *   const guard = require('../../shared/services/emailGuardService');
 *   const check = await guard.checkEmail(email);
 *   if (check.blocked) return error(res, check.reason, 400);
 */
const https  = require('https');
const logger = require('../logger');
const cache  = require('../cacheService');

const CACHE_TTL = 7 * 24 * 60 * 60; // 7 days per domain

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { Accept: 'application/json' }, timeout: 4000 }, (res) => {
      let raw = '';
      res.on('data', (c) => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch { resolve(null); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

/**
 * Kiểm tra email có phải tạm thời/giả không.
 * @param {string} email
 * @returns {{ blocked: boolean, reason: string, disposable: boolean, invalidFormat: boolean }}
 */
async function checkEmail(email) {
  if (!email || !email.includes('@')) {
    return { blocked: true, reason: 'Định dạng email không hợp lệ', invalidFormat: true };
  }

  const domain    = email.split('@')[1].toLowerCase();
  const cacheKey  = `email_guard:${domain}`;
  const cached    = await cache.get(cacheKey).catch(() => null);
  if (cached !== null) return cached;

  try {
    // Disify: check single email — free, no auth required
    const data = await getJson(`https://api.disify.com/api/email/${encodeURIComponent(email)}`);

    if (!data) {
      // API down — allow through to not block legitimate users
      return { blocked: false, reason: 'api_unavailable', disposable: false };
    }

    const isDisposable = data.disposable === true;
    const invalidDns   = data.dns === false;

    const result = {
      blocked:       isDisposable || invalidDns,
      reason:        isDisposable
                       ? 'Email tạm thời không được phép đăng ký'
                       : invalidDns
                         ? 'Domain email không tồn tại (DNS không hợp lệ)'
                         : 'clean',
      disposable:    isDisposable,
      invalidFormat: data.format === false,
      domain,
    };

    // Cache per domain (disposable flag rarely changes)
    await cache.set(cacheKey, result, CACHE_TTL).catch(() => {});
    logger.debug(`[EmailGuard] ${email}: ${result.reason}`);
    return result;
  } catch (err) {
    logger.warn(`[EmailGuard] Disify check failed for ${email}: ${err.message}`);
    return { blocked: false, reason: 'api_error', disposable: false };
  }
}

module.exports = { checkEmail };
