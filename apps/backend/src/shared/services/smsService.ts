/**
 * SMS Service — Twilio (production) or console log (dev/test)
 *
 * Config:
 *   SMS_PROVIDER=twilio   — use Twilio (requires TWILIO_* vars)
 *   SMS_PROVIDER=console  — log to console (default, dev/test)
 */

const logger   = require('./logger');
const provider = process.env.SMS_PROVIDER || 'console';

// ── E.164 validation ──────────────────────────────────────────────────────────
const E164_REGEX = /^\+[1-9]\d{1,14}$/;

function validatePhone(phone) {
  if (!E164_REGEX.test(phone)) {
    throw new Error(`[SMS] Invalid phone number format: "${phone}". Expected E.164 (e.g. +84901234567)`);
  }
}

// ── Twilio setup ──────────────────────────────────────────────────────────────
let twilioClient = null;

if (provider === 'twilio') {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    logger.error('[SMS] SMS_PROVIDER=twilio but TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER are missing');
  } else {
    try {
      const twilio = require('twilio');
      twilioClient = twilio(sid, token);
      logger.info('[SMS] Twilio client initialized');
    } catch {
      logger.warn('[SMS] twilio package not installed — falling back to console');
    }
  }
}

// ── Internal send with retry ──────────────────────────────────────────────────
async function _sendViaTwilio(to, body, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await twilioClient.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
        body,
      });
      return;
    } catch (err) {
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 500; // 500ms, 1000ms
        logger.warn(`[SMS] Twilio send failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms: ${err.message}`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        throw err; // propagate on last attempt
      }
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send an SMS message.
 * @param {string} to   Phone number in E.164 format (+84xxxxxxxxx)
 * @param {string} body Text content
 */
exports.send = async (to, body) => {
  validatePhone(to);

  if (provider === 'twilio' && twilioClient) {
    await _sendViaTwilio(to, body);
    return;
  }
  // Fallback: log to console (dev/test)
  logger.info(`[SMS → ${to}]: ${body}`);
};

/**
 * Send OTP via SMS.
 * Uses i18n if req.t is available, otherwise falls back to Vietnamese template.
 * @param {string} phone  E.164 phone number
 * @param {string} otp    OTP code
 * @param {Function} [t]  Optional i18next t() function for localization
 */
exports.sendOtp = async (phone, otp, t) => {
  const appName = process.env.APP_NAME || 'App';
  const minutes = Number(process.env.OTP_EXPIRE_MINUTES) || 5;

  const body = t
    ? t('sms.otp_message', { appName, otp, minutes })
    : `[${appName}] Mã OTP của bạn là: ${otp}. Có hiệu lực trong ${minutes} phút. Không chia sẻ với ai.`;

  return exports.send(phone, body);
};
