// @ts-nocheck
'use strict';
/**
 * emailService.ts — Transactional email via SMTP hoặc Gmail OAuth2.
 *
 * Transport selection (theo thứ tự ưu tiên):
 *   1. Gmail OAuth2 — khi GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN có mặt
 *      Dùng cho production với Gmail — không bị block như basic auth.
 *   2. SMTP generic — khi SMTP_USER + SMTP_PASS có mặt
 *      Dùng cho Mailtrap (dev), SendGrid, AWS SES, v.v.
 *   3. Console log fallback — khi không có credentials nào.
 *
 * Env vars:
 *   # Gmail OAuth2 (production Gmail)
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 *   SMTP_FROM (địa chỉ Gmail gửi đi, phải trùng OAuth2 account)
 *
 *   # SMTP generic
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * Usage:
 *   const { send, sendOtp, sendEmail } = require('./emailService');
 *   await send('user@example.com', 'Subject', '<p>Body</p>');
 *   await sendOtp('user@example.com', '123456');
 */

const nodemailer = require('nodemailer');
const logger     = require('../core/logger');

// ── Lazy transporter cache ────────────────────────────────────────────────────
let _transporter = null;

/**
 * Attempt to build a Gmail OAuth2 transporter.
 * Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN.
 * Returns null when any required var is missing.
 */
function _buildGmailOAuth2Transporter() {
  const clientId     = process.env.GOOGLE_CLIENT_ID     || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || '';
  const user         = process.env.SMTP_FROM            || process.env.SMTP_USER || '';

  if (!clientId || !clientSecret || !refreshToken || !user) return null;

  try {
    // nodemailer-gmail-oauth2 is NOT required — nodemailer handles OAuth2 natively
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type:         'OAuth2',
        user,
        clientId,
        clientSecret,
        refreshToken,
      },
    });
    logger.info('[Email] Using Gmail OAuth2 transport');
    return transport;
  } catch (err) {
    logger.warn(`[Email] Gmail OAuth2 setup failed: ${err.message} — falling back to SMTP`);
    return null;
  }
}

/**
 * Build a generic SMTP transporter.
 * Returns null when SMTP_USER or SMTP_PASS is missing.
 */
function _buildSmtpTransporter() {
  const host   = process.env.SMTP_HOST   || 'smtp.gmail.com';
  const port   = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user   = process.env.SMTP_USER   || '';
  const pass   = process.env.SMTP_PASS   || '';

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host, port, secure,
    auth:   { user, pass },
    pool:   true,
    maxConnections: 3,
    connectionTimeout: 10_000,
    greetingTimeout:   5_000,
  });
}

function _buildTransporter() {
  // Priority 1: Gmail OAuth2 (production-safe)
  const oauth2 = _buildGmailOAuth2Transporter();
  if (oauth2) return oauth2;

  // Priority 2: Generic SMTP (Mailtrap dev, SendGrid, SES, etc.)
  const smtp = _buildSmtpTransporter();
  if (smtp) return smtp;

  // Priority 3: No transport — console-only (dev with no email config)
  logger.warn('[Email] No transport configured — emails will be logged to console only');
  return null;
}

function _getTransporter() {
  if (!_transporter) _transporter = _buildTransporter();
  return _transporter;
}

/** Invalidate transporter cache (call after DB config changes). */
function reloadConfig() {
  _transporter = null;
}

// ── Core send ─────────────────────────────────────────────────────────────────

/**
 * Send a single email.
 * @param {string} to       Recipient address
 * @param {string} subject  Email subject
 * @param {string} html     HTML body
 * @param {string} [text]   Plain-text fallback (auto-generated from html if omitted)
 */
async function send(to, subject, html, text) {
  const from   = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@lkvip.com';
  const plain  = text || html.replace(/<[^>]+>/g, '').trim();
  const transport = _getTransporter();

  if (!transport) {
    logger.info(`[Email] DEV — To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    const info = await transport.sendMail({ from, to, subject, html, text: plain });
    logger.info(`[Email] Sent to ${to} | messageId=${info.messageId}`);
  } catch (err) {
    logger.error(`[Email] Failed to ${to}: ${err.message}`);
    throw err;
  }
}

// ── Named helpers ─────────────────────────────────────────────────────────────

/**
 * Send OTP verification email.
 * @param {string} to    Recipient email
 * @param {string} otp   6-digit OTP code
 */
async function sendOtp(to, otp) {
  const subject = 'Mã xác thực OTP — LKVIP';
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#1a56db">Mã xác thực OTP</h2>
      <p>Mã OTP của bạn là:</p>
      <div style="font-size:2rem;font-weight:bold;letter-spacing:8px;text-align:center;
                  padding:16px;background:#f3f4f6;border-radius:8px;color:#111">
        ${otp}
      </div>
      <p style="color:#6b7280;font-size:13px;margin-top:16px">
        Mã có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này với bất kỳ ai.
      </p>
    </div>`;
  return send(to, subject, html);
}

/**
 * Send a generic email. Alias kept for callers using sendEmail().
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 */
async function sendEmail(to, subject, html) {
  return send(to, subject, html);
}

/**
 * Render an email template string with variable substitution.
 * @param {string} template  HTML string with {{variable}} placeholders
 * @param {object} vars      Key/value map
 */
function renderEmail(template, vars) {
  if (!vars) return template;
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v ?? ''));
  }
  return out;
}

module.exports = { send, sendOtp, sendEmail, renderEmail, reloadConfig };
