/**
 * securityController.js
 * Handles HTTP layer for Security Settings endpoints:
 *   GET  /admin/settings/security        → get merged settings
 *   POST /admin/settings/security        → save settings
 *   POST /admin/settings/security/reset  → reset to defaults
 *   POST /admin/settings/security/test-captcha → validate captcha keys
 */
'use strict';

const { success, error } = require('../../../shared/utils/response');
const securityService     = require('../services/securityService');

/** GET /admin/settings/security */
exports.get = async (req, res) => {
  try {
    const data = await securityService.getSettings(req.prisma);
    return success(res, data, 'OK');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

/** POST /admin/settings/security  — body: partial settings object */
exports.save = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return error(res, 'Body phải là object chứa các trường cài đặt bảo mật.');
    }
    const updated = await securityService.saveSettings(req.prisma, req.body);
    return success(res, updated, 'Đã lưu cài đặt bảo mật');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

/** POST /admin/settings/security/reset */
exports.reset = async (req, res) => {
  try {
    const defaults = await securityService.resetSettings(req.prisma);
    return success(res, defaults, 'Đã reset cài đặt về mặc định');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

/** POST /admin/settings/security/test-captcha  { siteKey, secretKey, type } */
exports.testCaptcha = async (req, res) => {
  try {
    const { siteKey, secretKey, type } = req.body;
    const result = await securityService.testCaptchaConnection(siteKey, secretKey, type);
    // Always 200 — success field in body indicates pass/fail
    return success(res, result, result.message);
  } catch (e) {
    return error(res, e.message, 500);
  }
};
