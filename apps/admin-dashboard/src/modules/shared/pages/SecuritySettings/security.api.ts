// @ts-nocheck
/**
 * security.api.js
 * API service layer for Security Settings.
 * All calls go through the shared admin Axios client (with Bearer token).
 */
import api from '@admin/api/client';

const BASE = '/admin/settings/security';

export const securityApi = {
  /** @returns {Promise<import('../types').SecuritySettings>} */
  getSecuritySettings: () =>
    api.get(BASE).then(r => r.data?.data ?? r.data),

  /** @param {import('../types').SecuritySettings} data */
  saveSecuritySettings: (data) =>
    api.post(BASE, data).then(r => r.data),

  /**
   * @param {string} siteKey
   * @param {string} secretKey
   * @param {string} type
   * @returns {Promise<{success:boolean, message:string}>}
   */
  testCaptcha: (siteKey, secretKey, type) =>
    api.post(`${BASE}/test-captcha`, { siteKey, secretKey, type }).then(r => r.data),

  /** Reset all security settings to system defaults */
  resetToDefault: () =>
    api.post(`${BASE}/reset`).then(r => r.data),
};
