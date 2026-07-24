'use strict';
/**
 * SecurityMonitor — phát hiện tấn công injection, path traversal, XSS.
 *   • Scan inputs qua regex patterns
 *   • Block IP + log security event
 */
const redis  = require('../config/redis');
const logger = require('../shared/services/logger');

// Compiled attack patterns
const PATTERNS = [
  { name: 'sql_injection',    re: /(%27)|(')|(--|#)|(%23)|(;.*\s*(select|insert|update|delete|drop|alter|union|exec))/i },
  { name: 'xss',              re: /<\s*script|javascript:|onerror\s*=|onload\s*=|alert\s*\(|<\s*img[^>]+onerror/i },
  { name: 'path_traversal',   re: /\.\.\s*[/\\]|\/etc\/passwd|\/proc\//i },
  { name: 'command_injection', re: /[;&|`$]\s*(ls|cat|rm|curl|wget|chmod|bash|sh|python|node)\b/i },
  { name: 'template_inject',  re: /\{\{.*\}\}|\$\{.*\}|<[%].*[%]>/i },
];

const BLOCK_DURATION_SEC = 3600; // 1 giờ

class SecurityMonitor {
  constructor() {}

  /**
   * Scan một chuỗi input.
   * @returns {{ detected: boolean, pattern: string|null }}
   */
  scanInput(input) {
    if (typeof input !== 'string' || input.length === 0) return { detected: false, pattern: null };

    for (const { name, re } of PATTERNS) {
      if (re.test(input)) {
        return { detected: true, pattern: name };
      }
    }
    return { detected: false, pattern: null };
  }

  /**
   * Scan toàn bộ request body / query params (recursive).
   * @returns {{ detected: boolean, pattern: string|null, field: string|null }}
   */
  scanRequest(obj, path = '') {
    if (!obj || typeof obj !== 'object') {
      const result = this.scanInput(String(obj || ''));
      return result.detected ? { ...result, field: path } : { detected: false };
    }

    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = path ? `${path}.${key}` : key;
      if (typeof value === 'string') {
        const r = this.scanInput(value);
        if (r.detected) return { ...r, field: fieldPath };
      } else if (value && typeof value === 'object') {
        const r = this.scanRequest(value, fieldPath);
        if (r.detected) return r;
      }
    }
    return { detected: false };
  }

  /**
   * Xử lý khi phát hiện tấn công.
   * Block IP + log event + alert.
   */
  async handleAttack(userId, ip, details) {
    try {
      // Block IP for 1 hour
      if (ip) {
        await redis.setEx(`blocked:ip:${ip}`, BLOCK_DURATION_SEC, '1');
      }

      // Security log
      const adminPrisma = this._adminPrisma();
      await adminPrisma.securityLog.create({
        data: {
          userId: userId || null,
          ip,
          type:     'injection',
          action:   'request_blocked',
          details,
          severity: 'high',
        },
      });

      logger.security('injection_attack_blocked', { userId, ip, details });
    } catch (err) {
      logger.error('[SecurityMonitor] handleAttack error', { err: err.message });
    }
  }

  _adminPrisma() {
    const { getPrismaClient } = require('../../config/databases');
    return getPrismaClient('admin');
  }
}

module.exports = SecurityMonitor;
