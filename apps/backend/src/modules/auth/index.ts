'use strict';
/**
 * Auth Module
 *
 * Cung cấp các endpoint xác thực OTP dùng chung cho tất cả sub-projects:
 * - POST /send   — Gửi mã OTP về email
 * - POST /verify — Xác thực mã OTP
 */
const router = require('./controllers/otpController');

module.exports = { router };
