// @ts-nocheck
'use strict';
/**
 * smsService.ts — Multi-project SMS gateway (Twilio / console fallback).
 *
 * Config via env vars:
 *   SMS_PROVIDER          = 'twilio' | 'console'  (default: 'console')
 *   TWILIO_ACCOUNT_SID    = ACxxx
 *   TWILIO_AUTH_TOKEN     = xxx
 *   TWILIO_PHONE_NUMBER   = +1…
 *
 * All phone numbers MUST be in E.164 format (+countryCode…).
 *
 * Usage:
 *   const sms = require('./smsService');
 *   await sms.send('+84901234567', 'Tin nhắn của bạn');
 *   await sms.sendOtp('+84901234567', '123456');
 */

const logger   = require('../core/logger');
const https    = require('https');

const SMS_PROVIDER = (process.env.SMS_PROVIDER || 'console').toLowerCase();

// ── E.164 validation ─────────────────────────────────────────────────────────

const E164_RE = /^\+[1-9]\d{7,14}$/;

function validatePhone(phone) {
  if (!phone || !E164_RE.test(phone)) {
    throw new Error(`Invalid phone number format: "${phone}". Must be E.164 (e.g. +84901234567).`);
  }
}

// ── Provider implementations ──────────────────────────────────────────────────

async function _sendTwilio(to, body) {
  const sid    = process.env.TWILIO_ACCOUNT_SID;
  const token  = process.env.TWILIO_AUTH_TOKEN;
  const from   = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    logger.warn('[SMS] Twilio credentials missing — falling back to console');
    logger.info(`[SMS] CONSOLE to=${to}: ${body}`);
    return;
  }

  const payload = new URLSearchParams({ To: to, From: from, Body: body }).toString();

  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.twilio.com',
      path:     `/2010-04-01/Accounts/${sid}/Messages.json`,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization':  'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      },
      timeout: 10_000,
    };
    const req = https.request(opts, (res) => {
      let raw = '';
      res.on('data', (c) => raw += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          logger.info(`[SMS] Twilio sent to ${to}`);
          resolve();
        } else {
          let msg = `Twilio error ${res.statusCode}`;
          try { msg = JSON.parse(raw)?.message || msg; } catch {}
          reject(new Error(msg));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('SMS timeout')); });
    req.write(payload);
    req.end();
  });
}

async function _sendConsole(to, body) {
  logger.info(`[SMS] CONSOLE to=${to}: ${body}`);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send a raw SMS message.
 * @param {string} to    E.164 phone number
 * @param {string} body  Message text
 */
async function send(to, body) {
  validatePhone(to);
  if (SMS_PROVIDER === 'twilio') return _sendTwilio(to, body);
  return _sendConsole(to, body);
}

/**
 * Send OTP code via SMS.
 * @param {string}   to   E.164 phone number
 * @param {string}   otp  6-digit code
 * @param {Function} [t]  Optional i18n translation function t(key, vars) → string
 */
async function sendOtp(to, otp, t) {
  const body = t
    ? t('sms.otp_message', { otp })
    : `Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.`;
  return send(to, body);
}

module.exports = { send, sendOtp };
